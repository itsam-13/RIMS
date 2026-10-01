# Retail Inventory Management System (RIMS) — Project Crux & Handover Guide

> **Agent Directive:** This document is the single source of truth for the entire Retail Inventory Management System (RIMS). If context tokens are exhausted or a new AI agent takes over, **read this file first**. You do not need to scan all project files and directories. Everything implemented to date, recent merge history, architectural decisions, database schemas, API contracts, known issues, and immediate next steps are documented below.

---

## 1. Project Overview & Identity

- **Project Name:** Retail Inventory Management System (`RetailInventoryMgmt` / `HCLTech-RIMS`)
- **Package Base:** `com.hcl.inventory`
- **Core Domain:** Multi-warehouse retail inventory tracking, supplier procurement (Purchase Orders), customer sales order fulfillment with strict stock reservation/cancellation, internal stock transfers, audit logging (Stock Movements), and role-based JWT security.
- **Repository Location:** `c:\Users\acer\Desktop\HCLTech-RIMS`
- **Active Git Branch:** `main` (tracks `origin/main`)
- **Directory Layout:**
  ```text
  HCLTech-RIMS/
  ├── backend/           # Spring Boot REST API (Java 27, JPA, JJWT, Postgres, Port 8081)
  │   ├── .mvn/
  │   ├── mvnw / mvnw.cmd
  │   ├── pom.xml
  │   └── src/
  ├── frontend/          # Frontend client web application
  ├── docs/              # System crux and design guidelines
  │   ├── DESIGN.md
  │   └── PROJECT_CRUX.md
  └── README.md
  ```
- **Recent Pull & Merge History:**
  - `feb4656`: Added visual design system authority [`docs/DESIGN.md`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/DESIGN.md).
  - `f4d5ee5`: "backend completed" — Integrated Spring Security (Stateless JWT), Customer Order fulfillment, BCrypt hashing, expanded roles (`ADMIN`, `WAREHOUSE_MANAGER`, `SALES`), write-only password serialization, and fixed `Product` price validation.
  - `7df0815`: Clean merge of `origin/main` into local `main`.
  - Directory reorganization: Separated project root into `backend/` and `frontend/`.

---

## 2. Technology Stack & Runtime Environment

| Layer | Technology | Details / Version |
| :--- | :--- | :--- |
| **Runtime** | Java | JDK 27 installed at `C:\Program Files\Java\jdk-27` |
| **Framework** | Spring Boot | `4.1.1` (`spring-boot-starter-parent`) |
| **Web & REST** | Spring MVC | `spring-boot-starter-webmvc` |
| **Persistence** | Spring Data JPA / Hibernate | `spring-boot-starter-data-jpa` |
| **Database** | PostgreSQL (Main) / H2 (Test) | Main: `jdbc:postgresql://localhost:5432/inventory` |
| **Validation** | Jakarta Bean Validation | `spring-boot-starter-validation` (Hibernate Validator) |
| **Security** | Spring Security + JJWT | `spring-boot-starter-security`, JJWT `0.12.6` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) |
| **Boilerplate** | Lombok | `lombok` (requires compiler annotation processor configuration for JDK 27) |
| **Build Tool** | Maven Wrapper | `./mvnw.cmd` (Windows PowerShell / CMD) |

---

## 3. Database Schema & Domain Entity Models

All entities use `GenerationType.IDENTITY` for primary keys (`Long id`). Foreign keys use `@ManyToOne` and `@OneToMany(mappedBy = ..., cascade = CascadeType.ALL, orphanRemoval = true)`.

### Entity Breakdown & Relationships

```
    ┌───────────────┐               ┌────────────────┐
    │   Category    │1             *│    Product     │
    │  (id, name)   ├───────────────┤(id, name, sku, │
    └───────────────┘               │ price, reorder)│
                                    └───────┬────────┘
                                            │1
                                            │*
    ┌───────────────┐               ┌───────┴────────┐
    │   Warehouse   │1             *│   Inventory    │
    │(id, name, loc,├───────────────┤  (quantity,    │
    │   capacity)   │               │product+wh uniq)│
    └───────┬───────┘               └────────────────┘
            │1
            │*
   ┌────────┴───────────────┬────────────────────────┐
   │                        │                        │
   ▼                        ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  PurchaseOrder   │  │  CustomerOrder   │  │  StockMovement  │
│(supplier, status,│  │(user, wh, status,│  │(product, fromWh,│
│   warehouse)     │  │   custName)      │  │  toWh, type, qty│
└────────┬─────────┘  └────────┬─────────┘  └─────────────────┘
         │1                    │1
         │*                    │*
┌────────┴─────────┐  ┌────────┴─────────┐
│PurchaseOrderItem │  │    OrderItem     │
│(product, qty,    │  │(product, qty,    │
│  unitCost)       │  │  unitPrice)      │
└──────────────────┘  └──────────────────┘
```

1. **`User`** (`users` table) — [`User.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/User.java)
   - Fields: `id`, `username` (unique), `email` (unique), `password` (BCrypt hashed, `@JsonProperty(access = Access.WRITE_ONLY)` to prevent API leakage), `role` (`User.Role`: `ADMIN`, `WAREHOUSE_MANAGER`, `SALES`).
   - *Note:* [`Role.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Role.java) (`USER, ADMIN`) is a legacy file; `User.java` defines its own inner enum `User.Role`.
2. **`Category`** (`categories` table) — [`Category.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Category.java)
   - Fields: `id`, `name` (unique).
3. **`Product`** (`product` table) — [`Product.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Product.java)
   - Fields: `id`, `name`, `sku` (unique), `price` (`BigDecimal`, validated with `@NotNull` and `@PositiveOrZero`), `reorderLevel` (`Integer`), `category` (`@ManyToOne`).
   - Transient: `categoryId` (`Long`).
4. **`Warehouse`** (`warehouses` table) — [`Warehouse.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Warehouse.java)
   - Fields: `id`, `name` (unique), `location`, `capacity` (`Integer`).
5. **`Inventory`** (`inventory` table) — [`Inventory.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Inventory.java)
   - Fields: `id`, `product` (`@ManyToOne`), `warehouse` (`@ManyToOne`), `quantity` (`Integer`).
   - Unique constraint: `[product_id, warehouse_id]`.
   - Transient: `productId` (`Long`), `warehouseId` (`Long`).
6. **`Supplier`** (`suppliers` table) — [`Supplier.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Supplier.java)
   - Fields: `id`, `name`, `contactEmail`, `phone`, `leadTimeDays` (`Integer`).
7. **`PurchaseOrder`** (`purchase_orders` table) — [`PurchaseOrder.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/PurchaseOrder.java)
   - Fields: `id`, `supplier` (`@ManyToOne`), `warehouse` (`@ManyToOne` destination), `status` (`PENDING`, `ORDERED`, `RECEIVED`, `CANCELLED`), `orderDate` (`LocalDateTime`), `items` (`List<PurchaseOrderItem>`).
   - Transient: `supplierId` (`Long`), `warehouseId` (`Long`).
8. **`PurchaseOrderItem`** (`purchase_order_items` table) — [`PurchaseOrderItem.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/PurchaseOrderItem.java)
   - Fields: `id`, `purchaseOrder` (`@ManyToOne`), `product` (`@ManyToOne`), `quantity`, `unitCost` (`BigDecimal`).
   - Transient: `productId` (`Long`).
9. **`StockMovement`** (`stock_movements` table) — [`StockMovement.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/StockMovement.java)
   - Fields: `id`, `product` (`@ManyToOne`), `fromWarehouse` (`@ManyToOne`), `toWarehouse` (`@ManyToOne`), `quantity`, `type` (`IN`, `OUT`, `TRANSFER`), `timestamp` (`LocalDateTime`).
   - Transient: `productId`, `fromWarehouseId`, `toWarehouseId`.
10. **`CustomerOrder`** (`customer_orders` table) — [`CustomerOrder.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/CustomerOrder.java)
    - Fields: `id`, `customerName`, `status` (`PLACED`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `orderDate`, `warehouse` (`@ManyToOne` fulfillment hub), `user` (`@ManyToOne` sales rep / staff), `items` (`List<OrderItem>`).
    - Transient: `warehouseId` (`Long`), `userId` (`Long`).
11. **`OrderItem`** (`order_items` table) — [`OrderItem.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/OrderItem.java)
    - Fields: `id`, `customerOrder` (`@ManyToOne`), `product` (`@ManyToOne`), `quantity`, `unitPrice` (`BigDecimal`).
    - Transient: `productId` (`Long`).

### The Transient ID DTO Pattern

Incoming JSON requests send flat foreign keys (e.g. `productId`, `warehouseId`, `supplierId`). Entities use `@Transient` fields for deserialization. Service classes resolve the actual database entities and attach them before persisting. `@JsonManagedReference` and `@JsonBackReference` prevent infinite circular loops during JSON serialization of bidirectional parent-child collections.

---

## 4. Security & JWT Architecture

- **Security Config:** [`SecurityConfig.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/config/SecurityConfig.java) (`@Configuration`, `@EnableMethodSecurity`, stateless session)
- **Token Utility:** [`JwtUtil.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/security/JwtUtil.java) (generates & parses HMAC SHA-256 tokens)
- **Authentication Filter:** [`JwtAuthFilter.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/security/JwtAuthFilter.java) (inspects `Authorization: Bearer <token>`, assigns `ROLE_` authorities)
- **Password Hasher:** [`PasswordConfig.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/config/PasswordConfig.java) (`BCryptPasswordEncoder`)
- **Key & Expiration:** In [`application.yaml`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/resources/application.yaml):
  - `jwt.secret`: `"dlRQWJrpkt71ooEzYwMiCxhWN5ntDcTUPQwj1xGL4Hw="`
  - `jwt.expiration-ms`: `86400000` (24 hours)

### Route Protection Summary
- `POST /api/auth/login` — **Public** (verifies credentials, returns JWT token)
- `POST /api/users/register` — **Public** (hashes password with BCrypt, stores user)
- `/error` — **Public**
- `DELETE /api/**` — Restricted to **`ROLE_ADMIN`**
- All other endpoints — Require **`Bearer <token>`** authentication
- Unauthorized: HTTP 401 JSON `{"error":"Unauthorized: missing or invalid token"}`
- Forbidden: HTTP 403 JSON `{"error":"Forbidden: insufficient role"}`

---

## 5. Business Workflows & State Machines

### A. Inventory Management ([`InventoryService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/InventoryService.java))
- `createInventory(Inventory)`: Initial stock creation. Rejects if a pair already exists.
- `updateQuantity(id, newQuantity)`: Direct count overwrite (physical stock audit).
- `adjustQuantity(productId, warehouseId, delta)`: Modifies quantity by positive/negative delta. Throws if missing or resulting stock < 0.
- `adjustOrCreateQuantity(productId, warehouseId, delta)`: Modifies quantity; creates a zero-stock row first if the product is new to that warehouse.
- `getAvailableQuantity(productId, warehouseId)`: Safe query returning available count or `0`.

### B. Stock Movements ([`StockMovementService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/StockMovementService.java))
Atomic stock movement recording and inventory sync:
- **`IN`**: Stock arrives at `toWarehouseId` $\rightarrow$ calls `adjustOrCreateQuantity(productId, toWarehouseId, +quantity)`.
- **`OUT`**: Stock leaves `fromWarehouseId` $\rightarrow$ validates stock, calls `adjustQuantity(productId, fromWarehouseId, -quantity)`.
- **`TRANSFER`**: Inter-warehouse transfer $\rightarrow$ atomically decrements `fromWarehouseId` and increments `toWarehouseId`.

### C. Purchase Orders ([`PurchaseOrderService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/PurchaseOrderService.java))
- Status lifecycle: `PENDING` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` (or `CANCELLED`).
- `markAsOrdered(id)`: Transitions `PENDING` $\rightarrow$ `ORDERED`.
- `markAsReceived(id)`: Validates order; increments target warehouse inventory for every line item via `adjustOrCreateQuantity()`; sets `RECEIVED`.
- `cancelOrder(id)`: Marks `CANCELLED` (prohibited if already `RECEIVED`).

### D. Customer Orders ([`CustomerOrderService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/CustomerOrderService.java))
- Status lifecycle: `PLACED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED` (or `CANCELLED`).
- `placeOrder(CustomerOrder)`:
  1. Validates entire order upfront across all items. Checks `getAvailableQuantity >= item.quantity`. If **any** item is insufficient, the whole order fails with an error and zero stock is changed.
  2. Decrements inventory for all items via `adjustQuantity(..., -quantity)`.
  3. Sets status to `PLACED` and saves order.
- `markAsShipped(id)`: `PLACED` $\rightarrow$ `SHIPPED`.
- `markAsDelivered(id)`: `SHIPPED` $\rightarrow$ `DELIVERED`.
- `cancelOrder(id)`: Restores inventory for all items back to the warehouse using `adjustOrCreateQuantity(..., +quantity)`. Sets status to `CANCELLED` (prohibited once `DELIVERED`).

---

## 6. Complete REST API Catalog

All endpoints begin with `/api`. Unless marked **[Public]**, all requests require header `Authorization: Bearer <token>`.

### Authentication & Users
| Method | Path | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | **Public** | Authenticate & get JWT | `{"username":"admin","password":"password"}` |
| `POST` | `/api/users/register` | **Public** | Register account | `{"username":"alice","email":"alice@example.com","password":"secret","role":"SALES"}` |
| `GET` | `/api/users` | Auth | List all users | - |
| `GET` | `/api/users/{id}` | Auth | Get user by ID | - |
| `PUT` | `/api/users/{id}` | Auth | Update profile | `{"username":"alice","email":"alice@new.com","role":"SALES","password":""}` |
| `DELETE`| `/api/users/{id}` | **Admin** | Delete user | - |

### Products & Categories
| Method | Path | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Auth | List categories | - |
| `GET` | `/api/categories/{id}` | Auth | Get category | - |
| `POST` | `/api/categories` | Auth | Create category | `{"name":"Electronics"}` |
| `PUT` | `/api/categories/{id}` | Auth | Update category | `{"name":"Home Appliances"}` |
| `DELETE`| `/api/categories/{id}` | **Admin** | Delete category | - |
| `GET` | `/api/products` | Auth | List products | - |
| `GET` | `/api/products/{id}` | Auth | Get product by ID | - |
| `POST` | `/api/products` | Auth | Create product | `{"name":"Laptop","sku":"SKU-LAP-01","price":899.99,"reorderLevel":5,"categoryId":1}` |
| `PUT` | `/api/products/{id}` | Auth | Update product | `{"name":"Laptop Pro","sku":"SKU-LAP-01","price":999.99,"reorderLevel":5,"categoryId":1}` |
| `DELETE`| `/api/products/{id}` | **Admin** | Delete product | - |

### Warehouses & Inventory
| Method | Path | Access | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/warehouses` | Auth | List warehouses | - |
| `GET` | `/api/warehouses/{id}` | Auth | Get warehouse | - |
| `POST` | `/api/warehouses` | Auth | Create warehouse | `{"name":"Central Hub","location":"Chicago","capacity":10000}` |
| `PUT` | `/api/warehouses/{id}` | Auth | Update warehouse | `{"name":"Central Hub","location":"Chicago","capacity":12000}` |
| `DELETE`| `/api/warehouses/{id}` | **Admin** | Delete warehouse | - |
| `GET` | `/api/inventory` | Auth | All inventory records | - |
| `GET` | `/api/inventory/warehouse/{warehouseId}` | Auth | Stock by warehouse | - |
| `GET` | `/api/inventory/product/{productId}` | Auth | Stock by product | - |
| `GET` | `/api/inventory/{id}` | Auth | Single inventory record | - |
| `POST` | `/api/inventory` | Auth | Initialize stock | `{"productId":1,"warehouseId":2,"quantity":100}` |
| `PUT` | `/api/inventory/{id}` | Auth | Audit/set exact count | `{"quantity":120}` |
| `PATCH`| `/api/inventory/adjust?productId=1&warehouseId=2` | Auth | Delta adjust | `{"delta":-5}` or `{"delta":25}` |
| `DELETE`| `/api/inventory/{id}` | **Admin** | Delete inventory row | - |

### Suppliers & Purchase Orders (Procurement)
| Method | Path | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | Auth | List suppliers | - |
| `GET` | `/api/suppliers/{id}` | Auth | Get supplier | - |
| `POST` | `/api/suppliers` | Auth | Create supplier | `{"name":"Acme Logistics","contactEmail":"orders@acme.com","phone":"555-0100","leadTimeDays":5}` |
| `PUT` | `/api/suppliers/{id}` | Auth | Update supplier | - |
| `DELETE`| `/api/suppliers/{id}` | **Admin** | Delete supplier | - |
| `GET` | `/api/purchase-orders` | Auth | List POs | - |
| `GET` | `/api/purchase-orders/supplier/{supplierId}` | Auth | POs by supplier | - |
| `GET` | `/api/purchase-orders/{id}` | Auth | Get PO by ID | - |
| `POST` | `/api/purchase-orders` | Auth | Create PO with items | `{"supplierId":1,"warehouseId":2,"items":[{"productId":1,"quantity":50,"unitCost":450.00}]}` |
| `PATCH`| `/api/purchase-orders/{id}/mark-ordered` | Auth | PENDING $\rightarrow$ ORDERED | - |
| `PATCH`| `/api/purchase-orders/{id}/mark-received`| Auth | ORDERED $\rightarrow$ RECEIVED (increments stock) | - |
| `PATCH`| `/api/purchase-orders/{id}/cancel` | Auth | Cancel PO | - |

### Customer Orders (Sales Fulfillment)
| Method | Path | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Auth | List customer orders | - |
| `GET` | `/api/orders/warehouse/{warehouseId}` | Auth | Orders by warehouse | - |
| `GET` | `/api/orders/{id}` | Auth | Get order by ID | - |
| `POST` | `/api/orders` | Auth | Place order (reserves stock) | `{"customerName":"John Doe","warehouseId":1,"userId":2,"items":[{"productId":1,"quantity":2,"unitPrice":899.99}]}` |
| `PATCH`| `/api/orders/{id}/mark-shipped` | Auth | PLACED $\rightarrow$ SHIPPED | - |
| `PATCH`| `/api/orders/{id}/mark-delivered` | Auth | SHIPPED $\rightarrow$ DELIVERED | - |
| `PATCH`| `/api/orders/{id}/cancel` | Auth | Cancel order (restores stock) | - |

### Stock Movements (Audit Trail & Transfers)
| Method | Path | Access | Description | Request Body Examples |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/stock-movements` | Auth | List movements | - |
| `GET` | `/api/stock-movements/product/{productId}` | Auth | Filter by product | - |
| `GET` | `/api/stock-movements/{id}` | Auth | Get movement | - |
| `POST` | `/api/stock-movements` | Auth | Record movement & update stock | **IN:** `{"productId":1,"toWarehouseId":2,"quantity":50,"type":"IN"}`<br>**OUT:** `{"productId":1,"fromWarehouseId":2,"quantity":10,"type":"OUT"}`<br>**TRANSFER:** `{"productId":1,"fromWarehouseId":2,"toWarehouseId":3,"quantity":20,"type":"TRANSFER"}` |

---

## 7. Critical Known Issues & Gotchas (MUST READ BEFORE CODING)

### 🟢 Gotcha 1: JDK 27 vs Lombok Compilation [RESOLVED]
- Fixed in `pom.xml` by setting `<java.version>27</java.version>` and `<lombok.version>1.18.48</lombok.version>`. Maven compile now completes with `BUILD SUCCESS`.

### 🟢 Gotcha 2: PostgreSQL SCRAM Password & Database Setup [RESOLVED]
- Database `inventory` was created in PostgreSQL, and `password: riza` was configured in `application.yaml`.
- Configured server port to `8081` in `application.yaml` (`server.port: 8081`).
- Verified live application launch on port 8081.

### 🟡 Gotcha 2: Category Is Not Bound in `ProductService`
- **Symptom:** When creating or updating a product with `categoryId`, `product.getCategory()` remains `null` in the database.
- **Cause:** In [`ProductService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/ProductService.java), `resolveCategory(Long categoryId)` exists but is never invoked.
- **Fix:** In `createProduct`: `product.setCategory(resolveCategory(product.getCategoryId()))`. In `updateProduct`: `existing.setCategory(resolveCategory(updatedProduct.getCategoryId()))`.

### 🟡 Gotcha 3: Missing Global Exception Handler (`@RestControllerAdvice`)
- **Symptom:** `EntityNotFoundException` triggers HTTP 500 instead of clean 404 JSON; `IllegalArgumentException` triggers HTTP 500 instead of clean 400 JSON.
- **Fix:** Add a `com.hcl.inventory.exception.GlobalExceptionHandler` annotated with `@RestControllerAdvice`.

### 🟡 Gotcha 4: Test Database Isolation
- **Symptom:** `./mvnw.cmd test` will fail if local PostgreSQL is not running on port 5432.
- **Fix:** Add [`src/test/resources/application.yaml`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/test/resources/application.yaml) with in-memory H2 configuration:
  ```yaml
  spring:
    datasource:
      url: jdbc:h2:mem:inventory;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
      username: sa
      password:
      driver-class-name: org.h2.Driver
    jpa:
      hibernate:
        ddl-auto: create-drop
  ```

### 🟢 Gotcha 5: Fixed Validation Bug in `Product.java` [RESOLVED]
- `@NotBlank` on `BigDecimal price` was already fixed to `@NotNull` and `@PositiveOrZero` in commit `f4d5ee5`.

### 🟢 Gotcha 6: Redundant `Role.java`
- [`Role.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/model/Role.java) contains `USER, ADMIN`. `User.java` contains `public enum Role { ADMIN, WAREHOUSE_MANAGER, SALES }`. The application uses `User.Role`. The standalone `Role.java` can be cleaned up or deleted to avoid confusion.

---

## 8. What Has Been Done vs Immediate Roadmap

### Completed So Far
- [x] All 11 JPA entity models with relationship mappings and transient ID deserialization.
- [x] All 9 Spring Data JPA repositories with custom query methods.
- [x] Complete service layer with transactional lifecycles:
  - Inventory management (direct audit, delta adjusts, safe quantity reads).
  - Stock movements (`IN`, `OUT`, `TRANSFER`).
  - Purchase order procurement (`PENDING` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED`).
  - Customer order fulfillment with atomic stock reservation and cancellation replenishment (`PLACED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`).
  - User registration & password encryption.
- [x] REST controllers for all 10 modules.
- [x] Stateless JWT authentication, BCrypt hashing, and role-based Spring Security filter chain.
- [x] Visual UI design system authority in [`docs/DESIGN.md`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/DESIGN.md).
- [x] Full automated test audit & defect matrix in [`docs/TEST_REPORT.md`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/TEST_REPORT.md).

### Immediate Next Steps (Priority Order for Incoming Agent)
> **Note:** Refer to the full defect catalog and code fixes in [`docs/TEST_REPORT.md`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/TEST_REPORT.md).
1. **Fix Compilation in [`backend/pom.xml`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/backend/pom.xml)** [DONE]:
   - Applied JDK 27 target and Lombok `1.18.48` compiler annotation processor configuration. `.\mvnw.cmd compile` passes.
2. **Wire Category Resolution in [`ProductService.java`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/src/main/java/com/hcl/inventory/service/ProductService.java)**:
   - Call `resolveCategory()` on creation and update.
3. **Create Global Exception Handler**:
   - Add `GlobalExceptionHandler` returning consistent JSON errors for 400, 404, 409, and 422.
4. **Setup H2 Test Profile & Write Tests**:
   - Add `src/test/resources/application.yaml`.
   - Add service and controller tests. Validate with `.\mvnw.cmd test`.
5. **Develop UI / Frontend**:
   - Build frontend interface matching the Swiss/Editorial visual identity defined in [`docs/DESIGN.md`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/DESIGN.md):
     - Warehouse capacity visualizer and low-stock alert dashboard.
     - Product and inventory management tables.
     - Purchase order creation and receiving interface.
     - Customer order placement and fulfillment tracker.
     - Stock movement transfer modal and audit trail.
     - JWT login and session persistence.
6. **OpenAPI / Swagger Documentation**:
   - Add `springdoc-openapi-starter-webmvc-ui` to `pom.xml` for interactive API testing at `/swagger-ui.html`.

---

## 9. Essential Command Reference

All backend commands run from the `backend/` directory (`c:\Users\acer\Desktop\HCLTech-RIMS\backend`):

```powershell
# Navigate to backend
cd c:\Users\acer\Desktop\HCLTech-RIMS\backend

# Compile the backend
.\mvnw.cmd compile

# Run tests (with test H2 profile)
.\mvnw.cmd test

# Package JAR
.\mvnw.cmd package -DskipTests

# Start the Spring Boot application (Port 8081)
.\mvnw.cmd spring-boot:run

# Inspect Git State from project root
cd ..
git status
git log -n 5 --oneline
```
