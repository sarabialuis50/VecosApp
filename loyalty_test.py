import requests
import sys

class LoyaltySpecificTester:
    def __init__(self, base_url="https://pwa-platform-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.business_token = None

    def test_demo_business_loyalty(self):
        """Test loyalty functionality on demo business"""
        # Login to demo business
        login_data = {
            "email": "test@menupro.co",
            "password": "123456"
        }

        login_response = requests.post(
            f"{self.base_url}/api/auth/login",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )

        if login_response.status_code != 200:
            print("❌ Failed to login to demo business")
            return False

        self.business_token = login_response.json()['access_token']
        print("✅ Logged into demo business")

        slug = "demo-restaurante"

        # Test 1: Get current loyalty config
        config_response = requests.get(
            f"{self.base_url}/api/loyalty/{slug}/config"
        )
        
        if config_response.status_code == 200:
            config = config_response.json()
            print(f"✅ Current loyalty config: {config}")
            print(f"   - Active: {config.get('activo')}")
            print(f"   - Pesos per point: {config.get('pesos_por_punto')}")
            print(f"   - Min redeem: {config.get('puntos_minimo_canje')}")
            print(f"   - Point value: {config.get('valor_punto_en_descuento')}")
        else:
            print("❌ Failed to get loyalty config")
            return False

        # Test 2: Get customer points for a test phone
        test_phone = "+57 300 555 1234"
        points_response = requests.get(
            f"{self.base_url}/api/loyalty/{slug}/points/{test_phone}"
        )

        if points_response.status_code == 200:
            points = points_response.json()
            print(f"✅ Customer points for {test_phone}:")
            print(f"   - Available: {points.get('puntos_disponibles', 0)}")
            print(f"   - Total earned: {points.get('puntos_totales', 0)}")
            print(f"   - Total purchases: ${points.get('total_compras', 0):,.0f}")
            print(f"   - Order count: {points.get('cantidad_pedidos', 0)}")
        else:
            print("❌ Failed to get customer points")
            return False

        # Test 3: Get loyalty customers list
        customers_response = requests.get(
            f"{self.base_url}/api/loyalty/{slug}/customers",
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if customers_response.status_code == 200:
            customers = customers_response.json()
            print(f"✅ Found {len(customers)} loyalty customers")
            for customer in customers[:3]:  # Show first 3
                print(f"   - {customer.get('nombre', 'No name')}: {customer.get('puntos_disponibles', 0)} pts")
        else:
            print("❌ Failed to get customer list")

        # Test 4: Test order creation with customer phone
        order_data = {
            "items": [{
                "producto_id": "test-loyalty-product",
                "nombre": "Test Loyalty Product",
                "cantidad": 1,
                "precio_unitario": 25000,  # Should give 25 points with default config
                "notas": "Test order for loyalty"
            }],
            "cliente_nombre": "Test Loyalty Customer",
            "cliente_telefono": test_phone,
            "tipo": "takeaway"
        }

        order_response = requests.post(
            f"{self.base_url}/api/orders/{slug}",
            json=order_data,
            headers={'Content-Type': 'application/json'}
        )

        if order_response.status_code == 200:
            order = order_response.json()
            order_id = order['id']
            print(f"✅ Created test order: {order_id}")

            # Mark as delivered to award points
            update_response = requests.put(
                f"{self.base_url}/api/orders/{slug}/{order_id}",
                json={"estado": "entregado"},
                headers={'Content-Type': 'application/json'}
            )

            if update_response.status_code == 200:
                print("✅ Marked order as delivered")

                # Check updated points
                updated_points_response = requests.get(
                    f"{self.base_url}/api/loyalty/{slug}/points/{test_phone}"
                )

                if updated_points_response.status_code == 200:
                    updated_points = updated_points_response.json()
                    print(f"✅ Updated customer points:")
                    print(f"   - Available: {updated_points.get('puntos_disponibles', 0)}")
                    print(f"   - Total purchases: ${updated_points.get('total_compras', 0):,.0f}")

                    # Test points redemption if customer has enough points
                    available_points = updated_points.get('puntos_disponibles', 0)
                    if available_points >= config.get('puntos_minimo_canje', 50):
                        redeem_points = min(available_points, config.get('puntos_minimo_canje', 50))
                        redeem_response = requests.post(
                            f"{self.base_url}/api/loyalty/{slug}/redeem",
                            json={
                                "telefono": test_phone,
                                "puntos_a_canjear": redeem_points
                            },
                            headers={'Content-Type': 'application/json'}
                        )

                        if redeem_response.status_code == 200:
                            redeem_result = redeem_response.json()
                            print(f"✅ Points redemption: {redeem_result.get('mensaje')}")
                            print(f"   - Success: {redeem_result.get('exito')}")
                            print(f"   - Discount: ${redeem_result.get('descuento_aplicado', 0):,.0f}")
                            print(f"   - Points remaining: {redeem_result.get('puntos_restantes', 0)}")
                        else:
                            print("❌ Failed to redeem points")
                    else:
                        print(f"⚠️  Not enough points to redeem (need {config.get('puntos_minimo_canje', 50)}, have {available_points})")

                else:
                    print("❌ Failed to get updated points")
            else:
                print("❌ Failed to mark order as delivered")
        else:
            print("❌ Failed to create test order")

        return True

def main():
    print("🎯 Testing Loyalty Program on Demo Business...")
    print("=" * 50)
    
    tester = LoyaltySpecificTester()
    success = tester.test_demo_business_loyalty()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Loyalty program tests completed!")
        return 0
    else:
        print("❌ Loyalty program tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())