import requests
import sys
from datetime import datetime

class MenuIAAPITester:
    def __init__(self, base_url="https://pwa-platform-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.business_token = None
        self.employee_token = None
        self.business_data = None
        self.employee_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'business_id': None,
            'product_ids': [],
            'table_ids': [],
            'employee_ids': [],
            'order_ids': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after 10 seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        success1, _ = self.run_test("Health Check", "GET", "", 200)
        success2, _ = self.run_test("API Health", "GET", "health", 200)
        return success1 and success2

    def test_business_registration(self):
        """Test business registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_business = {
            "nombre": f"Test Restaurant {timestamp}",
            "slug": f"test-restaurant-{timestamp}",
            "email": f"test{timestamp}@menuia.co",
            "password": "123456",
            "telefono": "+57 300 123 4567",
            "whatsapp": "+57 300 123 4567",
            "descripcion": "Test restaurant for API testing"
        }

        success, response = self.run_test(
            "Business Registration",
            "POST",
            "auth/register",
            200,
            data=test_business
        )

        if success and 'access_token' in response:
            self.business_token = response['access_token']
            self.business_data = response['business']
            self.created_ids['business_id'] = response['business']['id']
            print(f"   📝 Created business: {response['business']['slug']}")
            return True
        return False

    def test_business_login(self):
        """Test business login with test credentials"""
        login_data = {
            "email": "test@menuia.co",
            "password": "123456"
        }

        success, response = self.run_test(
            "Business Login (Demo Account)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )

        if success and 'access_token' in response:
            self.business_token = response['access_token']
            self.business_data = response['business']
            print(f"   📝 Logged in as: {response['business']['nombre']}")
            return True
        return False

    def test_business_me(self):
        """Test get current business info"""
        if not self.business_token:
            return False

        success, response = self.run_test(
            "Get Business Info",
            "GET",
            "auth/me",
            200,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )
        return success

    def test_business_by_slug(self):
        """Test get business by slug"""
        if not self.business_data:
            return False

        slug = self.business_data['slug']
        success, response = self.run_test(
            "Get Business by Slug",
            "GET",
            f"business/{slug}",
            200
        )
        return success

    def test_products_crud(self):
        """Test product CRUD operations"""
        if not self.business_token or not self.business_data:
            return False

        slug = self.business_data['slug']
        
        # Create product
        product_data = {
            "nombre": "Bandeja Paisa Test",
            "descripcion": "Delicious test dish",
            "precio": 25000,
            "categoria": "Platos fuertes",
            "disponible": True
        }

        success1, response = self.run_test(
            "Create Product",
            "POST",
            f"products/{slug}",
            200,
            data=product_data,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if not success1:
            return False

        product_id = response.get('id')
        if product_id:
            self.created_ids['product_ids'].append(product_id)

        # Get products
        success2, _ = self.run_test(
            "Get Products",
            "GET",
            f"products/{slug}",
            200
        )

        # Get categories
        success3, _ = self.run_test(
            "Get Categories",
            "GET",
            f"categories/{slug}",
            200
        )

        # Update product
        if product_id:
            update_data = {"precio": 30000}
            success4, _ = self.run_test(
                "Update Product",
                "PUT",
                f"products/{slug}/{product_id}",
                200,
                data=update_data,
                headers={"Authorization": f"Bearer {self.business_token}"}
            )
        else:
            success4 = False

        return success1 and success2 and success3 and success4

    def test_tables_crud(self):
        """Test table CRUD operations"""
        if not self.business_token or not self.business_data:
            return False

        slug = self.business_data['slug']
        
        # Create table
        table_data = {
            "numero": 99,
            "capacidad": 4,
            "ubicacion": "Test Area"
        }

        success1, response = self.run_test(
            "Create Table",
            "POST",
            f"tables/{slug}",
            200,
            data=table_data,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if not success1:
            return False

        table_id = response.get('id')
        if table_id:
            self.created_ids['table_ids'].append(table_id)

        # Get tables
        success2, _ = self.run_test(
            "Get Tables",
            "GET",
            f"tables/{slug}",
            200
        )

        # Get table by number
        success3, _ = self.run_test(
            "Get Table by Number",
            "GET",
            f"tables/{slug}/99/info",
            200
        )

        return success1 and success2 and success3

    def test_employees_crud(self):
        """Test employee CRUD operations"""
        if not self.business_token or not self.business_data:
            return False

        slug = self.business_data['slug']
        
        # Create employee
        employee_data = {
            "nombre": "Test Waiter",
            "pin": "9999",
            "rol": "mesero"
        }

        success1, response = self.run_test(
            "Create Employee",
            "POST",
            f"employees/{slug}",
            200,
            data=employee_data,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if not success1:
            return False

        employee_id = response.get('id')
        if employee_id:
            self.created_ids['employee_ids'].append(employee_id)
            self.employee_data = response

        # Get employees
        success2, _ = self.run_test(
            "Get Employees",
            "GET",
            f"employees/{slug}",
            200,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        # Test employee login
        success3, emp_response = self.run_test(
            "Employee Login",
            "POST",
            f"employee/login/{slug}",
            200,
            data={"pin": "9999"}
        )

        if success3 and 'access_token' in emp_response:
            self.employee_token = emp_response['access_token']

        return success1 and success2 and success3

    def test_orders_flow(self):
        """Test order creation and management"""
        if not self.business_data:
            return False

        slug = self.business_data['slug']
        
        # Create an order
        order_data = {
            "items": [{
                "producto_id": "test-product-id",
                "nombre": "Test Product",
                "cantidad": 2,
                "precio_unitario": 15000,
                "notas": "Test order"
            }],
            "cliente_nombre": "Test Customer",
            "cliente_telefono": "+57 300 123 4567",
            "tipo": "takeaway"
        }

        success1, response = self.run_test(
            "Create Order",
            "POST",
            f"orders/{slug}",
            200,
            data=order_data
        )

        if not success1:
            return False

        order_id = response.get('id')
        if order_id:
            self.created_ids['order_ids'].append(order_id)

        # Get orders
        success2, _ = self.run_test(
            "Get Orders",
            "GET",
            f"orders/{slug}",
            200
        )

        # Get active orders
        success3, _ = self.run_test(
            "Get Active Orders",
            "GET",
            f"orders/{slug}/active",
            200
        )

        # Track order
        if order_id:
            success4, _ = self.run_test(
                "Track Order",
                "GET",
                f"orders/{slug}/track/{order_id}",
                200
            )
        else:
            success4 = False

        return success1 and success2 and success3 and success4

    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.business_token or not self.business_data:
            return False

        slug = self.business_data['slug']
        success, _ = self.run_test(
            "Business Analytics",
            "GET",
            f"business/{slug}/analytics",
            200,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )
        return success

    def test_loyalty_program(self):
        """Test loyalty program functionality"""
        if not self.business_data:
            return False

        slug = self.business_data['slug']
        
        # Test 1: Get loyalty config (should return default)
        success1, config_response = self.run_test(
            "Get Loyalty Config",
            "GET",
            f"loyalty/{slug}/config",
            200
        )
        
        if not success1:
            return False

        # Test 2: Create/Update loyalty config (requires auth)
        if not self.business_token:
            return False
            
        loyalty_config = {
            "activo": True,
            "pesos_por_punto": 1000,
            "puntos_minimo_canje": 50,
            "valor_punto_en_descuento": 100,
            "mensaje_bienvenida": "¡Bienvenido al programa de fidelidad!",
            "mensaje_puntos_ganados": "¡Ganaste {puntos} puntos! Total acumulado: {total}"
        }

        success2, _ = self.run_test(
            "Create/Update Loyalty Config",
            "POST",
            f"loyalty/{slug}/config",
            200,
            data=loyalty_config,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if not success2:
            return False

        # Test 3: Get customer points (new customer should have 0 points)
        test_phone = "+57 300 123 4567"
        success3, points_response = self.run_test(
            "Get Customer Points (New Customer)",
            "GET",
            f"loyalty/{slug}/points/{test_phone}",
            200
        )

        if not success3:
            return False

        # Test 4: Get loyalty customers list (requires auth)
        success4, _ = self.run_test(
            "Get Loyalty Customers",
            "GET",
            f"loyalty/{slug}/customers",
            200,
            headers={"Authorization": f"Bearer {self.business_token}"}
        )

        if not success4:
            return False

        # Test 5: Create order to test points awarding
        order_data = {
            "items": [{
                "producto_id": "test-product-loyalty",
                "nombre": "Test Product for Loyalty",
                "cantidad": 1,
                "precio_unitario": 50000,  # This should give 50 points (50000/1000)
                "notas": "Test loyalty order"
            }],
            "cliente_nombre": "Test Loyalty Customer",
            "cliente_telefono": test_phone,
            "tipo": "takeaway"
        }

        success5, order_response = self.run_test(
            "Create Order for Loyalty Test",
            "POST",
            f"orders/{slug}",
            200,
            data=order_data
        )

        if not success5:
            return False

        order_id = order_response.get('id')
        if order_id:
            self.created_ids['order_ids'].append(order_id)

        # Test 6: Mark order as delivered to award points
        update_data = {"estado": "entregado"}
        success6, _ = self.run_test(
            "Mark Order as Delivered (Award Points)",
            "PUT",
            f"orders/{slug}/{order_id}",
            200,
            data=update_data
        )

        if not success6:
            return False

        # Test 7: Check customer points after order delivery
        success7, updated_points = self.run_test(
            "Get Customer Points (After Order)",
            "GET",
            f"loyalty/{slug}/points/{test_phone}",
            200
        )

        if success7 and updated_points.get('puntos_disponibles', 0) > 0:
            print(f"   📝 Customer earned {updated_points['puntos_disponibles']} points")
        
        # Test 8: Redeem points
        redeem_data = {
            "telefono": test_phone,
            "puntos_a_canjear": min(50, updated_points.get('puntos_disponibles', 0))  # Redeem 50 or available points
        }

        success8, redeem_response = self.run_test(
            "Redeem Points",
            "POST",
            f"loyalty/{slug}/redeem",
            200,
            data=redeem_data
        )

        if success8 and redeem_response.get('exito'):
            print(f"   📝 Points redeemed successfully: {redeem_response.get('mensaje', '')}")

        # Test 9: Get points transactions
        success9, _ = self.run_test(
            "Get Points Transactions",
            "GET",
            f"loyalty/{slug}/transactions/{test_phone}",
            200
        )

        return success1 and success2 and success3 and success4 and success5 and success6 and success7 and success8 and success9

    def cleanup(self):
        """Clean up created test data"""
        if not self.business_token or not self.business_data:
            return

        slug = self.business_data['slug']
        
        # Delete products
        for product_id in self.created_ids['product_ids']:
            self.run_test(
                "Cleanup Product",
                "DELETE",
                f"products/{slug}/{product_id}",
                200,
                headers={"Authorization": f"Bearer {self.business_token}"}
            )

        # Delete tables
        for table_id in self.created_ids['table_ids']:
            self.run_test(
                "Cleanup Table",
                "DELETE",
                f"tables/{slug}/{table_id}",
                200,
                headers={"Authorization": f"Bearer {self.business_token}"}
            )

        # Delete employees
        for employee_id in self.created_ids['employee_ids']:
            self.run_test(
                "Cleanup Employee",
                "DELETE",
                f"employees/{slug}/{employee_id}",
                200,
                headers={"Authorization": f"Bearer {self.business_token}"}
            )

def main():
    print("🚀 Starting Menu.IA API Testing...")
    print("=" * 50)
    
    tester = MenuIAAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Business Login (Demo)", tester.test_business_login),
        ("Business Info", tester.test_business_me),
        ("Business by Slug", tester.test_business_by_slug),
        ("Products CRUD", tester.test_products_crud),
        ("Tables CRUD", tester.test_tables_crud),
        ("Employees CRUD", tester.test_employees_crud),
        ("Orders Flow", tester.test_orders_flow),
        ("Analytics", tester.test_analytics),
        ("Loyalty Program", tester.test_loyalty_program),
    ]

    # If demo account doesn't exist, try registration
    if not tester.business_token:
        print("\n⚠️  Demo account not found, trying registration...")
        if tester.test_business_registration():
            # Re-run tests with new account
            for test_name, test_func in tests[2:]:  # Skip health and login
                test_func()
    else:
        # Run all tests with demo account
        for test_name, test_func in tests:
            test_func()

    # Cleanup
    print("\n🧹 Cleaning up test data...")
    tester.cleanup()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())