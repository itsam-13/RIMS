# Retail Inventory Management System (RIMS)

[![Java](https://img.shields.io/badge/Java-27-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring_Security-JWT-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white)](https://spring.io/projects/spring-security)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Hibernate](https://img.shields.io/badge/Hibernate-ORM_7.x-59666C?style=for-the-badge&logo=hibernate&logoColor=white)](https://hibernate.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#)

An enterprise-grade, distributed **Retail Inventory Management System (RIMS)** built with Spring Boot, Spring Data JPA, and Spring Security. The system provides real-time multi-warehouse inventory tracking, supplier procurement management, atomic customer order fulfillment, inter-warehouse stock transfer auditing, and stateless JWT role-based access control.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Domain & Data Models](#domain--data-models)
- [Security & Authentication](#security--authentication)
- [REST API Reference](#rest-api-reference)
- [Prerequisites & Setup](#prerequisites--setup)
- [Running the Application](#running-the-application)
- [Documentation & AI Agent Continuity](#documentation--ai-agent-continuity)

---

## Key Features

- **Multi-Warehouse Stock Management**: Real-time stock tracking across geographically dispersed warehouses with unique product-warehouse constraints, capacity auditing, and threshold-based reorder alerts.
- **Supplier Procurement (Purchase Orders)**: Complete procurement pipeline (`PENDING` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED`) that automatically updates warehouse inventory upon receipt.
- **Customer Sales Fulfillment**: Order placement with strict atomic validation (orders are rejected if any line item lacks stock), automated stock reservation, status transitions (`PLACED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`), and automated stock restoration on cancellation.
- **Stock Movement Auditing**: Complete audit trail for inventory transitions:
  - `IN`: Supplier deliveries and new stock arrivals.
  - `OUT`: Dispatches, shrinkage, and sales adjustments.
  - `TRANSFER`: Atomic inter-warehouse stock transfers.
- **Stateless Role-Based JWT Security**: Secured endpoints with HMAC SHA-256 JWT tokens, BCrypt password hashing, write-only password serialization, and granular role authorization (`ADMIN`, `WAREHOUSE_MANAGER`, `SALES`).

---

## System Architecture

```
                      ┌─────────────────────────────────────────┐
                      │              Frontend App               │
                      │          (React / Vite Client)          │
                      └────────────────────┬────────────────────┘
                                           │ HTTP / JSON
                                           │ Authorization: Bearer <JWT>
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                               Backend REST API (Port 8081)                             │
│                                                                                       │
│  ┌───────────────────────────┐           ┌─────────────────────────────────────────┐  │
│  │   Security & Auth Filter  │           │            REST Controllers             │  │
│  │   (JwtAuthFilter / JJWT)  │──────────►│ Auth, Users, Products, Categories,      │  │
│  └───────────────────────────┘           │ Warehouses, Inventory, Orders, Movement │  │
│                                          └────────────────────┬────────────────────┘  │
│                                                               │                       │
│                                                               ▼                       │
│                                          ┌─────────────────────────────────────────┐  │
│                                          │             Service Layer               │  │
│                                          │ Transactional lifecycles & validations  │  │
│                                          └────────────────────┬────────────────────┘  │
│                                                               │                       │
│                                                               ▼                       │
│                                          ┌─────────────────────────────────────────┐  │
│                                          │        Spring Data JPA Layer            │  │
│                                          │ 11 Entity Models & JPA Repositories     │  │
│                                          └────────────────────┬────────────────────┘  │
└───────────────────────────────────────────────────────────────┼───────────────────────┘
                                                                │ JDBC / SQL
                                                                ▼
                                                   ┌─────────────────────────┐
                                                   │    PostgreSQL Database  │
                                                   │   (inventory @ :5432)   │
                                                   └─────────────────────────┘
```

---

## Repository Structure

```text
HCLTech-RIMS/
├── backend/                       # Spring Boot REST API Service
│   ├── .mvn/                      # Maven Wrapper configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hcl/inventory/
│   │   │   │   ├── config/        # Security & Password encoder configs
│   │   │   │   ├── controller/    # 10 REST Controllers
│   │   │   │   ├── dto/           # Request/Response payloads
│   │   │   │   ├── model/         # 11 JPA Domain Entities
│   │   │   │   ├── repository/    # 9 Spring Data JPA Repositories
│   │   │   │   ├── security/      # JWT Filter & Token Utility
│   │   │   │   ├── service/       # Business workflows & lifecycle logic
│   │   │   │   └── InventoryApplication.java
│   │   │   └── resources/
│   │   │       └── application.yaml # Spring & DataSource configuration
│   │   └── test/                  # Test suites & resources
│   ├── mvnw / mvnw.cmd            # Maven wrapper executables
│   └── pom.xml                    # Maven project configuration (Java 27, Spring Boot 4.1.1)
├── frontend/                      # Client web application (in progress)
├── docs/                          # Architecture & design documentation
│   ├── DESIGN.md                  # Comprehensive visual design system authority
│   └── PROJECT_CRUX.md            # Single source of truth / agent handover documentation
└── README.md                      # Project manual & quickstart
```

---

## Domain & Data Models

| Entity | Table | Key Fields | Description |
| :--- | :--- | :--- | :--- |
| **`User`** | `users` | `id`, `username`, `email`, `password`, `role` | Staff and managers (`ADMIN`, `WAREHOUSE_MANAGER`, `SALES`). Passwords are never serialized back in API responses. |
| **`Category`** | `categories` | `id`, `name` | Product taxonomy and grouping. |
| **`Product`** | `product` | `id`, `name`, `sku`, `price`, `reorderLevel`, `category_id` | Master catalog item with SKU uniqueness and safety reorder thresholds. |
| **`Warehouse`** | `warehouses` | `id`, `name`, `location`, `capacity` | Physical storage facilities. |
| **`Inventory`** | `inventory` | `id`, `product_id`, `warehouse_id`, `quantity` | Stock levels per product-warehouse pair (`UNIQUE (product_id, warehouse_id)`). |
| **`Supplier`** | `suppliers` | `id`, `name`, `contactEmail`, `phone`, `leadTimeDays` | Approved external vendors. |
| **`PurchaseOrder`** | `purchase_orders` | `id`, `supplier_id`, `warehouse_id`, `status`, `orderDate` | Inbound procurement orders (`PENDING`, `ORDERED`, `RECEIVED`, `CANCELLED`). |
| **`PurchaseOrderItem`**| `purchase_order_items` | `id`, `purchase_order_id`, `product_id`, `quantity`, `unitCost` | Line items for supplier purchase orders. |
| **`CustomerOrder`** | `customer_orders` | `id`, `customerName`, `warehouse_id`, `user_id`, `status`, `orderDate` | Outbound customer orders (`PLACED`, `SHIPPED`, `DELIVERED`, `CANCELLED`). |
| **`OrderItem`** | `order_items` | `id`, `customer_order_id`, `product_id`, `quantity`, `unitPrice` | Line items for customer sales orders. |
| **`StockMovement`** | `stock_movements` | `id`, `product_id`, `from_warehouse_id`, `to_warehouse_id`, `quantity`, `type`, `timestamp` | Audit log for `IN`, `OUT`, and `TRANSFER` operations. |

---

## Security & Authentication

Authentication is handled via stateless **JSON Web Tokens (JWT)**:

- **Tokens**: Signed using HMAC SHA-256 (`jjwt-api 0.12.6`). Tokens expire after 24 hours.
- **Header**: Authenticated requests must pass `Authorization: Bearer <token>`.
- **Public Routes**:
  - `POST /api/auth/login` — Returns token and role upon valid username/password.
  - `POST /api/users/register` — Creates user account with BCrypt password encryption.
- **Admin Only**:
  - All `DELETE /api/**` endpoints require `ROLE_ADMIN`.
- **Protected Routes**:
  - All inventory adjustments, orders, movements, and catalog updates require valid authentication.

---

## REST API Reference

All backend endpoints are rooted at `/api`:

### 🔐 Authentication & Users
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and receive JWT |
| `POST` | `/api/users/register` | Public | Register a new user |
| `GET` | `/api/users` | Authenticated | List all registered users |
| `GET` | `/api/users/{id}` | Authenticated | Get user profile by ID |
| `PUT` | `/api/users/{id}` | Authenticated | Update user profile |
| `DELETE`| `/api/users/{id}` | **Admin** | Remove user account |

### 📦 Products & Categories
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Authenticated | Retrieve all categories |
| `POST` | `/api/categories` | Authenticated | Create a new category |
| `PUT` | `/api/categories/{id}` | Authenticated | Update category name |
| `DELETE`| `/api/categories/{id}` | **Admin** | Delete category |
| `GET` | `/api/products` | Authenticated | List all products in catalog |
| `GET` | `/api/products/{id}` | Authenticated | Get single product by ID |
| `POST` | `/api/products` | Authenticated | Create product with SKU, price, and category |
| `PUT` | `/api/products/{id}` | Authenticated | Update product information |
| `DELETE`| `/api/products/{id}` | **Admin** | Delete product |

### 🏢 Warehouses & Inventory
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/warehouses` | Authenticated | List all warehouse locations |
| `POST` | `/api/warehouses` | Authenticated | Add a new warehouse |
| `PUT` | `/api/warehouses/{id}` | Authenticated | Update warehouse details |
| `DELETE`| `/api/warehouses/{id}` | **Admin** | Delete warehouse |
| `GET` | `/api/inventory` | Authenticated | View all warehouse stock rows |
| `GET` | `/api/inventory/warehouse/{warehouseId}` | Authenticated | Filter inventory by warehouse |
| `GET` | `/api/inventory/product/{productId}` | Authenticated | Filter inventory by product |
| `POST` | `/api/inventory` | Authenticated | Initialize stock for a product-warehouse pair |
| `PUT` | `/api/inventory/{id}` | Authenticated | Exact stock count override (audit) |
| `PATCH`| `/api/inventory/adjust?productId={p}&warehouseId={w}` | Authenticated | Delta stock adjustment (`{"delta": 10}`) |
| `DELETE`| `/api/inventory/{id}` | **Admin** | Remove inventory record |

### 🚚 Procurement & Suppliers
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/suppliers` | Authenticated | List suppliers |
| `POST` | `/api/suppliers` | Authenticated | Register new supplier |
| `GET` | `/api/purchase-orders` | Authenticated | List purchase orders |
| `POST` | `/api/purchase-orders` | Authenticated | Create PO with line items |
| `PATCH`| `/api/purchase-orders/{id}/mark-ordered` | Authenticated | Advance PO status to `ORDERED` |
| `PATCH`| `/api/purchase-orders/{id}/mark-received` | Authenticated | Receive PO and automatically add stock |
| `PATCH`| `/api/purchase-orders/{id}/cancel` | Authenticated | Cancel pending purchase order |

### 🛒 Customer Orders (Sales)
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Authenticated | List all customer sales orders |
| `GET` | `/api/orders/warehouse/{warehouseId}` | Authenticated | View orders fulfilled by warehouse |
| `POST` | `/api/orders` | Authenticated | Place order (validates & reserves stock) |
| `PATCH`| `/api/orders/{id}/mark-shipped` | Authenticated | Transition order from `PLACED` $\rightarrow$ `SHIPPED` |
| `PATCH`| `/api/orders/{id}/mark-delivered` | Authenticated | Transition order from `SHIPPED` $\rightarrow$ `DELIVERED` |
| `PATCH`| `/api/orders/{id}/cancel` | Authenticated | Cancel order and automatically restore stock |

### 🔄 Stock Movements & Transfers
| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stock-movements` | Authenticated | List all stock movement audit logs |
| `GET` | `/api/stock-movements/product/{productId}` | Authenticated | Movement logs for a specific product |
| `POST` | `/api/stock-movements` | Authenticated | Record an `IN`, `OUT`, or `TRANSFER` movement |

---

## Prerequisites & Setup

### Requirements
- **Java**: OpenJDK 27 (or 21+)
- **Database**: PostgreSQL 16+ running locally on port `5432`
- **Build Tool**: Maven Wrapper (included in repository)

### 1. Database Setup
Ensure PostgreSQL is running and create the `inventory` database:

```sql
CREATE DATABASE inventory;
```

*(Or via command line: `createdb -U postgres inventory`)*

### 2. Configure Credentials
Check [`backend/src/main/resources/application.yaml`](file:///c:/Users/acer/Desktop/HCLTech-RIMS/backend/src/main/resources/application.yaml) and ensure your PostgreSQL username and password match:

```yaml
server:
  port: 8081

spring:
  application:
    name: inventory
  datasource:
    url: jdbc:postgresql://localhost:5432/inventory
    username: postgres
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

---

## Running the Application

### 1. Compile the Backend
Navigate to the `backend/` directory:

```powershell
cd backend
.\mvnw.cmd compile
```

### 2. Start the Backend Server
Run Spring Boot on port **`8081`**:

```powershell
.\mvnw.cmd spring-boot:run
```

Once started, the API is available at: **`http://localhost:8081`**

### 3. Run the Test Suite
```powershell
.\mvnw.cmd test
```

### 4. Quick API Smoke Test
Register an administrator account and log in:

```powershell
# Register user
Invoke-RestMethod -Uri "http://localhost:8081/api/users/register" -Method Post -ContentType "application/json" -Body '{"username":"admin","email":"admin@example.com","password":"password123","role":"ADMIN"}'

# Authenticate & obtain JWT
Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
```

---

## Documentation & AI Agent Continuity

For detailed architectural decisions, lifecycle diagrams, and handover context:

- **[docs/PROJECT_CRUX.md](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/PROJECT_CRUX.md)** — **Crux & Handover Guide**: Single-source-of-truth document designed for fast onboarding and AI agent continuity without re-reading the entire codebase.
- **[docs/TEST_REPORT.md](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/TEST_REPORT.md)** — **System Test Audit & Defect Report**: Complete test execution matrix detailing passing vs broken components, reproduction payloads, and remediation code.
- **[docs/DESIGN.md](file:///c:/Users/acer/Desktop/HCLTech-RIMS/docs/DESIGN.md)** — **Design Authority**: Visual design identity, typography scale, anti-generic aesthetic rules, and UI guidelines for the upcoming frontend.
