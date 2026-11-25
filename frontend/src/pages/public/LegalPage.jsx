import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Shield, Cookie, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalPage() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = React.useState('autorizacion');

    const legalLinks = [
        { id: 'terminos', title: 'Términos y Condiciones de Uso de la Plataforma Menu.IA', icon: FileText },
        { id: 'autorizacion', title: 'Autorización de Tratamiento de datos personales Usuarios – Menu.IA', icon: Shield },
        { id: 'privacidad', title: 'Política de Tratamiento de Datos Personales (Política de Privacidad)', icon: Shield },
        { id: 'cookies', title: 'Política de Cookies – Colombia', icon: Cookie },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'terminos':
                return (
                    <>
                        <p className="text-xs font-black uppercase tracking-widest text-[#22B8CF] mb-4">Legal & Términos</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#111814] mb-8 leading-tight">
                            Términos y Condiciones de Uso de la Plataforma Menu.IA
                        </h1>
                        <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-sm md:text-base">
                            <h2 className="text-xl font-black text-[#111814] mt-10">1. ASPECTOS GENERALES</h2>
                            <p>
                                <strong>Menu.IA</strong> es una plataforma tecnológica constituida conforme a las leyes colombianas, con domicilio en la ciudad de Bogotá D.C., quien para los efectos de los presentes Términos y Condiciones se denominará “Menu.IA”.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">2. DEFINICIONES</h2>
                            <ul className="list-disc pl-6 space-y-3">
                                <li><strong>Comercio Aliado:</strong> Establecimiento de comercio (restaurante, bar, café, etc.) que exhibe y comercializa productos a través de Menu.IA.</li>
                                <li><strong>Duntos:</strong> Puntos de fidelidad o intangibles que el Usuario acumula en su cuenta para redimir en productos o beneficios dentro de los comercios aliados.</li>
                                <li><strong>Plataforma Menu.IA:</strong> Ecosistema virtual compuesto por la página web, Web-Apps de pedidos, App de Meseros y App de Reparto.</li>
                                <li><strong>Repartidor:</strong> Persona encargada de la gestión del pedido desde el comercio hasta el domicilio del Usuario, utilizando las herramientas de despacho de Menu.IA.</li>
                                <li><strong>Usuario/Consumidor:</strong> Persona natural que utiliza la plataforma para adquirir productos y servicios comercializados por los Comercios Aliados.</li>
                            </ul>

                            <h2 className="text-xl font-black text-[#111814] mt-10">3. OBJETO</h2>
                            <p>
                                Los presentes Términos y Condiciones regulan la autorización de uso que otorga Menu.IA a los Usuarios para que éstos ingresen a la Plataforma, se informen sobre los productos exhibidos por los Comercios Aliados y realicen pedidos de manera digital.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">4. FUNCIONAMIENTO DE LA PLATAFORMA</h2>
                            <p>
                                Menu.IA actúa como un <strong>portal de contacto</strong> y herramienta de gestión SaaS. Los Comercios Aliados son los únicos responsables de los precios, disponibilidad, calidad y entrega de los productos. Menu.IA no comercializa productos de manera directa ni presta servicios de logística propios, sino que pone a disposición la tecnología para conectar Comercios, Usuarios y Repartidores.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">5. DEBERES DEL USUARIO</h2>
                            <p>El Usuario se obliga a:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Ingresar datos veraces al registrarse o realizar pedidos.</li>
                                <li>Abstenerse de utilizar la plataforma para actos ilícitos o contrarios a la moral.</li>
                                <li>Disponer de los fondos necesarios para el pago de los pedidos.</li>
                                <li>Tratar de manera respetuosa al personal de los Comercios Aliados y Repartidores.</li>
                                <li>Verificar los datos del pedido (productos y dirección) antes de finalizar la compra.</li>
                            </ul>

                            <h2 className="text-xl font-black text-[#111814] mt-10">6. PRECIOS Y TARIFAS</h2>
                            <p>
                                Los precios son fijados exclusivamente por los Comercios Aliados. Menu.IA podrá cobrar una "Tarifa de Servicio" por el uso de la tecnología, la cual será siempre informada en el resumen de pago (Check-Out) antes de confirmar el pedido.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">7. PRODUCTOS DE USO RESTRINGIDO</h2>
                            <p>
                                La adquisición de bebidas alcohólicas y tabaco está estrictamente prohibida para menores de edad. Menu.IA y los Comercios Aliados se reservan el derecho de exigir la identificación oficial al momento de la entrega.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">8. GARANTÍA Y RETRACTO</h2>
                            <p>
                                Cualquier reclamación por calidad, estado o garantía de los productos debe tramitarse directamente con el Comercio Aliado que realizó la venta, de conformidad con la Ley 1480 de 2011.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">9. INDEMNIDAD Y MODIFICACIONES</h2>
                            <p>
                                Menu.IA podrá modificar estos términos en cualquier momento para mejorar el servicio. El Usuario es responsable de revisar periódicamente las actualizaciones en esta sección.
                            </p>
                        </div>
                    </>
                );
            case 'cookies':
                return (
                    <>
                        <p className="text-xs font-black uppercase tracking-widest text-[#22B8CF] mb-4">Legal & Privacidad</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#111814] mb-8 leading-tight">
                            Política de Cookies – Menu.IA
                        </h1>
                        <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-sm md:text-base">
                            <section>
                                <p>
                                    <strong>Menu.IA</strong> es una plataforma tecnológica constituida conforme a las leyes colombianas, con domicilio en la ciudad de Bogotá D.C., la cual administra y opera el ecosistema digital de Menu.IA por medio de la cual se conectan tres (3) tipos de usuarios: i) <strong>Aliados Comerciales</strong>, que exhiben, ofrecen y comercializan sus productos y/o servicios en la plataforma para que éstos sean adquiridos por los Usuarios/Consumidores por medio del mismo; ii) <strong>Usuarios/Consumidores</strong>, quienes a través del Sitio Web adquieren productos y/o servicios comercializados por los Aliados Comerciales; y iii) <strong>Usuarios de Gestión</strong>, quienes operan la plataforma para la preparación, gestión de órdenes y entrega de las solicitudes realizadas en el Sitio Web de Menu.IA.
                                </p>
                                <p className="mt-4">
                                    Por medio de la presente <strong>POLÍTICA DE COOKIES</strong> se da a conocer a los Usuarios/Consumidores el tratamiento que se le da a las cookies en su plataforma y a la información personal recolectada y almacenada por las mismas.
                                </p>
                                <p className="mt-4">
                                    Se aclara que con el propósito de proteger la información personal recolectada y almacenada por las Cookies sobre los Usuarios/Consumidores que tengan relación con <strong>Menu.IA</strong>, la presente Política de Cookies da cumplimiento estricto a la Política de Privacidad y a la Autorización de Tratamiento de Datos Personales de la plataforma.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">NATURALEZA JURÍDICA</h2>
                                <p>
                                    Por medio de la presente Política de Cookies se identifican el tipo de Cookies que se usan en el ecosistema digital de <strong>Menu.IA</strong> y el uso que se le dará a las mismas.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">DEFINICIONES</h2>
                                <ul className="space-y-4">
                                    <li><strong>Dato personal:</strong> Cualquier información concerniente o vinculada a personas naturales determinadas o determinables.</li>
                                    <li><strong>Base de datos personales:</strong> Conjunto organizado de datos personales que son objeto de tratamiento por una persona natural o jurídica.</li>
                                    <li><strong>Cookies:</strong> Archivos que recolectan información sobre los hábitos de navegación e inclinaciones de consumo de un Usuario/Consumidor en el Sitio Web de <strong>Menu.IA</strong> y eventualmente podrían conformar una base de datos. Las Cookies son recuperadas y almacenadas por Menu.IA para la consulta de las actividades y preferencias de los Usuarios/Consumidores, permitiendo identificar cómo mejorar el servicio ofrecido.</li>
                                    <li><strong>Comercio Electrónico:</strong> Comprende el envío, transmisión, recepción, almacenamiento de mensajes de datos por vía electrónica (Ley 527 de 1999).</li>
                                    <li><strong>Sitio Web:</strong> Serie de páginas web interrelacionadas entre sí e identificadas por un mismo nombre de dominio, accesibles mediante un navegador de internet.</li>
                                    <li><strong>Mensajes de datos:</strong> La información generada, enviada, recibida, almacenada o comunicada por medios electrónicos u ópticos.</li>
                                    <li><strong>Titular del dato personal:</strong> Persona natural cuyos datos son objeto de tratamiento, incluyendo Suscriptores, Clientes, Aliados y terceros.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">TIPOS DE COOKIES UTILIZADAS</h2>
                                <p className="mb-4"><strong>Menu.IA</strong> utiliza en su plataforma las siguientes Cookies:</p>
                                <ul className="list-disc pl-6 space-y-3">
                                    <li><strong>Cookies de Sesión:</strong> Recolectan información relativa al acceso y uso mientras el Usuario navega y se conservan únicamente durante ese tiempo.</li>
                                    <li><strong>Cookies Persistentes:</strong> Se almacenan durante un tiempo limitado en el navegador, aun cuando el Usuario ha finalizado de navegar.</li>
                                    <li><strong>Cookies Técnicas:</strong> Imprescindibles para el funcionamiento correcto del carrito de compras y la plataforma.</li>
                                    <li><strong>Cookies Funcionales:</strong> Almacenan preferencias (idioma, última dirección de envío, etc.) para ofrecer correctamente los servicios.</li>
                                    <li><strong>Cookies Analíticas:</strong> Permiten conocer el comportamiento de navegación y registrar contenidos de interés para mejorar el servicio.</li>
                                    <li><strong>Cookies Sociales:</strong> Permiten la interacción con redes sociales y widgets externos en la plataforma.</li>
                                    <li><strong>Cookies de Publicidad e Identificación:</strong> Recopilan preferencias para ofrecer publicidad relevante y establecer coincidencias con datos personales para enviar comunicaciones pertinentes.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">FINALIDADES DEL USO DE COOKIES</h2>
                                <ul className="space-y-4">
                                    <li><strong>Seguridad:</strong> Detectar actividad sospechosa o fraudulenta para proteger la cuenta del Usuario.</li>
                                    <li><strong>Autenticación:</strong> Reconocer e identificar al Usuario/Consumidor cuando visite el Sitio Web.</li>
                                    <li><strong>Personalización:</strong> Recordar búsquedas anteriores para ofrecer información adicional relacionada con sus intereses.</li>
                                    <li><strong>Rendimiento y Análisis:</strong> Realizar estudios internos sobre intereses y comportamientos para comprender mejor las necesidades de los Usuarios y perfeccionar las iniciativas comerciales.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">FORMAS DE CONTROLAR EL USO DE COOKIES</h2>
                                <p>
                                    Los Usuarios tienen la posibilidad de borrar, restringir o bloquear el uso de Cookies a través de la configuración de su navegador. Tenga en cuenta que cada navegador tiene su propia forma operativa de control:
                                </p>
                                <div className="flex flex-wrap gap-4 mt-4">
                                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#22B8CF] hover:underline font-bold">Google Chrome</a>
                                    <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[#22B8CF] hover:underline font-bold">Mozilla Firefox</a>
                                    <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#22B8CF] hover:underline font-bold">Safari</a>
                                </div>
                                <p className="mt-4 italic">
                                    Nota: Si realiza modificaciones en la configuración de las Cookies, <strong>Menu.IA</strong> no asegura el correcto funcionamiento de todas las funcionalidades de su Sitio Web.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">CANAL DE CONTACTO</h2>
                                <p>
                                    Cualquier consulta sobre el uso de Cookies en nuestra plataforma puede dirigirse al correo: <span className="text-[#22C55E] font-bold">info@menuia.co</span>
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">CAMBIOS A LA POLÍTICA</h2>
                                <p>
                                    Esta Política de Cookies podrá tener actualizaciones periódicas. Se recomienda al Usuario visitar esta sección con regularidad para estar informado de los cambios.
                                </p>
                            </section>
                        </div>
                    </>
                );
            case 'privacidad':
                return (
                    <>
                        <p className="text-xs font-black uppercase tracking-widest text-[#22B8CF] mb-4">Legal & Privacidad</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#111814] mb-8 leading-tight">
                            Política de Tratamiento de Datos Personales – Menu.IA
                        </h1>
                        <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-sm md:text-base">
                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">I. Introducción</h2>
                                <p>
                                    <strong>Menu.IA</strong> es una plataforma tecnológica que tiene como actividad principal conectar a consumidores finales con establecimientos gastronómicos (Comercios Aliados) a través de una infraestructura digital compuesta por una Web-App de pedidos, App de Meseros y App de Gestión de Reparto.
                                </p>
                                <p>
                                    Con la finalidad de dar cumplimiento estricto a la normatividad vigente de protección de Datos Personales, de acuerdo a lo establecido en la Ley 1581 de 2012 y el Decreto 1074 de 2015, presentamos esta Política con el propósito de proteger la información brindada por nuestros Titulares (clientes, comerciales, aliados y colaboradores).
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">II. Definiciones Clave</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Autorización:</strong> Consentimiento previo, expreso e informado del Titular.</li>
                                    <li><strong>Dato Personal:</strong> Cualquier información vinculada a una persona natural.</li>
                                    <li><strong>Responsable del Tratamiento:</strong> Menu.IA, quien decide sobre el uso de los datos.</li>
                                    <li><strong>Titular:</strong> Persona natural cuyos datos son objeto de tratamiento (Usuario final, dueño de comercio, repartidor).</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">III. Principios Rectores</h2>
                                <p>
                                    Nos regimos por los principios de <strong>Legalidad, Finalidad, Libertad, Veracidad, Transparencia, Seguridad y Confidencialidad</strong>. Sus datos solo serán utilizados para los fines que usted autorice.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">IV. Derechos de los Titulares</h2>
                                <p>Usted puede ejercer en cualquier momento sus derechos de:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Acceso, actualización y rectificación de sus datos.</li>
                                    <li>Solicitud de prueba de la autorización otorgada.</li>
                                    <li>Revocación del consentimiento o supresión del dato.</li>
                                    <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">V. Finalidades del Tratamiento</h2>
                                <p>Los datos recolectados por Menu.IA tienen como objetivos:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Gestionar pedidos y pagos en los Comercios Aliados.</li>
                                    <li>Operar el sistema de fidelidad y recompensas (Duntos).</li>
                                    <li>Enviar notificaciones operativas y de marketing vía WhatsApp, Email y Push.</li>
                                    <li>Mejorar la experiencia de usuario mediante análisis de comportamiento.</li>
                                    <li>Garantizar la seguridad y prevención de fraudes en los pedidos.</li>
                                    <li>Cumplir con obligaciones contables y administrativas.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">VI. Procedimientos para Consultas y Reclamos</h2>
                                <p>
                                    Para cualquier solicitud relacionada con sus datos, puede escribirnos a <span className="text-[#22C55E] font-bold">info@menuia.co</span>.
                                    Las consultas serán atendidas en un plazo máximo de diez (10) días hábiles, y los reclamos en quince (15) días hábiles, conforme a lo estipulado por la ley colombiana.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-[#111814] mb-4">VII. Vigencia</h2>
                                <p>
                                    Esta política rige a partir de su publicación y la información permanecerá en nuestras bases de datos mientras sea necesaria para cumplir con las finalidades descritas o por mandato legal.
                                </p>
                            </section>
                        </div>
                    </>
                );
            case 'autorizacion':
            default:
                return (
                    <>
                        <p className="text-xs font-black uppercase tracking-widest text-[#22B8CF] mb-4">Legal & Privacidad</p>
                        <h1 className="text-3xl md:text-4xl font-black text-[#111814] mb-8 leading-tight">
                            Autorización de Tratamiento de datos personales Usuarios – Menu.IA
                        </h1>
                        <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-sm md:text-base">
                            <p>
                                Para <strong>Menu.IA</strong>, sociedad debidamente constituida bajo las normas de la República de Colombia, proteger la privacidad de sus usuarios es muy importante. Por lo tanto, <strong>Menu.IA</strong> da estricto cumplimiento a lo dispuesto en la Ley Estatutaria 1581 de 2012, reglamentada parcialmente por los Decretos 1377 de 2013 y Decreto 886 de 2014, normas compiladas en el Decreto Único Nacional del Sector Comercio, Industria y Turismo 1074 de 2015 y aquellas normas que lo modifiquen.
                            </p>

                            <p>
                                <strong>Menu.IA</strong> le informa que sus datos serán tratados conforme a la <strong>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</strong> que se encuentra publicada en nuestra plataforma. En este caso, Menu.IA actúa como <strong>Responsable del Tratamiento</strong> de los Datos Personales, manteniendo su confidencialidad bajo altos estándares de seguridad tecnológica.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">1. Datos Recolectados y Tratamiento</h2>
                            <p>
                                Los datos recolectados (nombres, número celular, dirección, correo electrónico, fecha de nacimiento) se limitarán a la recolección, almacenamiento, uso y circulación para las finalidades descritas. Una vez cumplidas las finalidades, los datos serán suprimidos conforme a los términos de ley.
                            </p>

                            <h2 className="text-xl font-black text-[#111814] mt-10">2. Finalidades del Tratamiento</h2>
                            <p>El titular acepta de manera expresa que sus datos sean utilizados para:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Gestionar la creación y administración de la cuenta del usuario en la plataforma.</li>
                                <li>Facilitar la comunicación entre el Usuario y el Comercio Aliado para la correcta prestación del servicio.</li>
                                <li>Envío de notificaciones relativas a pedidos, actualizaciones de estado y soporte técnico.</li>
                                <li>Implementar y gestionar el programa de lealtad (Duntos) y beneficios personalizados.</li>
                                <li>Envío de comunicaciones de marketing, ofertas y promociones a través de canales como WhatsApp, SMS, Push y Correo Electrónico.</li>
                                <li>Realizar análisis de comportamiento del usuario para mejorar la personalización del servicio y la interfaz.</li>
                                <li>Prevenir fraudes, suplantación de identidad y garantizar la seguridad de la plataforma.</li>
                                <li>Cumplir con requerimientos legales de autoridades de inspección, vigilancia y control.</li>
                            </ul>

                            <h2 className="text-xl font-black text-[#111814] mt-10">3. Derechos del Titular</h2>
                            <p>Usted tiene derecho a:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Conocer, actualizar y rectificar sus datos personales.</li>
                                <li>Solicitar prueba de esta autorización.</li>
                                <li>Ser informado sobre el uso que se le da a sus datos.</li>
                                <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
                                <li>Revocar la autorización o solicitar la supresión del dato cuando no se respeten los principios legales.</li>
                            </ul>

                            <h2 className="text-xl font-black text-[#111814] mt-10">4. Canales de Atención</h2>
                            <p>Para ejercer sus derechos de "Habeas Data", Menu.IA dispone de los siguientes medios:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Atención Electrónica:</strong> A través del soporte oficial en la plataforma o al correo <span className="text-[#22C55E] font-bold">info@menuia.co</span>.</li>
                                <li><strong>SIC Facilita:</strong> El titular puede acudir al canal dispuesto por la Superintendencia de Industria y Comercio.</li>
                            </ul>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] font-inter">
            {/* Header */}
            <nav className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img src="/logos/logo-icon-white.png" alt="Menu.IA" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-heading font-black text-lg tracking-tighter">
                        <span className="text-[#22C55E]">Menu</span>
                        <span className="text-[#22B8CF]">.IA</span>
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/')} className="text-sm font-bold text-gray-600">
                        Ir a Menu.IA
                    </Button>
                    <Button onClick={() => navigate('/register')} className="bg-[#4ADE80] text-[#111814] font-bold rounded-xl hidden sm:block">
                        Quiero ser parte
                    </Button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
                {/* Sidebar */}
                <aside className="w-full md:w-80 shrink-0">
                    <div className="sticky top-24 space-y-2">
                        {legalLinks.map((link, idx) => (
                            <button
                                key={link.id}
                                onClick={() => setActiveSection(link.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3 group ${activeSection === link.id
                                    ? 'bg-white shadow-md border border-gray-100 text-[#22C55E]'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <link.icon className={`w-5 h-5 shrink-0 mt-0.5 ${activeSection === link.id ? 'text-[#22C55E]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                <span className="text-sm font-bold leading-tight">{link.title}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 min-h-[600px]">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="prose prose-slate lg:prose-lg max-w-none"
                    >
                        {renderContent()}

                        <div className="mt-12 p-8 bg-[#FAFAF9] rounded-3xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 italic mb-0">
                                Última actualización: 02 de Marzo de 2026. Al utilizar nuestra plataforma, usted acepta los términos aquí descritos.
                            </p>
                        </div>
                    </motion.div>
                </main>
            </div>

            {/* Footer minimal */}
            <footer className="bg-white border-t mt-20 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
                        © 2026 Burger Full - Todos los derechos reservados
                    </p>
                </div>
            </footer>
        </div>
    );
}
