"""
Motor central de IA de Menu.IA.

Reparto de proveedores:
  - DeepSeek  -> motor principal de la aplicación: chat web con clientes (pedidos,
                 registro, puntos, ruleta, niveles), Consultor IA, Insights, marketing,
                 descripciones y nutrición.
  - OpenAI    -> agente conversacional de WhatsApp. También se usa para lo que DeepSeek
                 no ofrece (transcripción de audio con Whisper y generación de imágenes)
                 y como respaldo automático si DeepSeek no está disponible.

DeepSeek expone una API compatible con OpenAI, así que ambos usan el mismo SDK.
"""
import os
import json
import re
import logging
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI

logger = logging.getLogger(__name__)

PROVIDER_DEEPSEEK = "deepseek"
PROVIDER_OPENAI = "openai"

_clients: Dict[str, OpenAI] = {}


def _deepseek_model() -> str:
    return os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")


def _openai_model() -> str:
    return os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")


def _api_key(provider: str) -> Optional[str]:
    if provider == PROVIDER_DEEPSEEK:
        return os.environ.get("DEEPSEEK_API_KEY")
    return os.environ.get("OPENAI_API_KEY")


def is_configured(provider: str) -> bool:
    return bool(_api_key(provider))


def get_client(provider: str) -> OpenAI:
    """Devuelve (y cachea) el cliente del proveedor. Las variables de entorno se leen
    de forma perezosa para respetar el orden de carga de dotenv en server.py."""
    key = _api_key(provider)
    if not key:
        raise RuntimeError(f"Falta la API key de {provider} en el entorno.")
    cache_key = f"{provider}:{key[-6:]}"
    if cache_key not in _clients:
        if provider == PROVIDER_DEEPSEEK:
            _clients[cache_key] = OpenAI(
                api_key=key,
                base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
            )
        else:
            _clients[cache_key] = OpenAI(api_key=key)
    return _clients[cache_key]


def model_for(provider: str) -> str:
    return _deepseek_model() if provider == PROVIDER_DEEPSEEK else _openai_model()


def _provider_chain(provider: str, allow_fallback: bool) -> List[str]:
    chain = [provider]
    if allow_fallback:
        other = PROVIDER_OPENAI if provider == PROVIDER_DEEPSEEK else PROVIDER_DEEPSEEK
        chain.append(other)
    return [p for p in chain if is_configured(p)]


def chat(
    messages: List[Dict[str, Any]],
    provider: str = PROVIDER_DEEPSEEK,
    tools: Optional[List[Dict[str, Any]]] = None,
    json_mode: bool = False,
    temperature: Optional[float] = None,
    allow_fallback: bool = True,
) -> Tuple[Any, str]:
    """Ejecuta una llamada de chat. Devuelve (mensaje, proveedor_usado).
    Si el proveedor principal falla o no tiene key, intenta con el otro."""
    chain = _provider_chain(provider, allow_fallback)
    if not chain:
        raise RuntimeError(
            "No hay proveedores de IA configurados. Define DEEPSEEK_API_KEY y/o OPENAI_API_KEY."
        )

    last_err: Optional[Exception] = None
    for prov in chain:
        try:
            kwargs: Dict[str, Any] = {"model": model_for(prov), "messages": messages}
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            if temperature is not None:
                kwargs["temperature"] = temperature
            res = get_client(prov).chat.completions.create(**kwargs)
            if prov != provider:
                logger.warning(f"IA: {provider} no disponible, se respondió con respaldo {prov}.")
            return res.choices[0].message, prov
        except Exception as e:
            last_err = e
            logger.warning(f"IA: fallo con {prov} ({model_for(prov)}): {e}")
    raise last_err  # type: ignore[misc]


def complete_text(
    system: str,
    user: str,
    provider: str = PROVIDER_DEEPSEEK,
    history: Optional[List[Dict[str, Any]]] = None,
    temperature: Optional[float] = None,
) -> Tuple[str, str]:
    """Respuesta de texto simple. `history` acepta mensajes con role user/model/assistant."""
    messages: List[Dict[str, Any]] = [{"role": "system", "content": system}]
    for msg in history or []:
        content = msg.get("content")
        if not content:
            continue
        role = "user" if msg.get("role") == "user" else "assistant"
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user})
    message, prov = chat(messages, provider=provider, temperature=temperature)
    return (message.content or "").strip(), prov


def _extract_json(text: str) -> Dict[str, Any]:
    text = (text or "").replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def complete_json(system: str, user: str, provider: str = PROVIDER_DEEPSEEK) -> Tuple[Dict[str, Any], str]:
    """Respuesta estructurada en JSON (modo json_object en ambos proveedores)."""
    if "json" not in (system + user).lower():
        system = system + "\nResponde únicamente con un objeto JSON válido."
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    message, prov = chat(messages, provider=provider, json_mode=True)
    return _extract_json(message.content or ""), prov


def message_to_dict(message: Any) -> Dict[str, Any]:
    """Convierte un mensaje del SDK en dict serializable para reenviarlo al modelo
    (necesario para mantener el historial de tool calls entre proveedores)."""
    data: Dict[str, Any] = {"role": "assistant", "content": message.content or ""}
    if getattr(message, "tool_calls", None):
        data["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in message.tool_calls
        ]
    return data
