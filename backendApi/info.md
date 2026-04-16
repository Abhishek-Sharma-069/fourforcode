# Backend API Deep Dive

This document is a more detailed explanation of the `backendApi` project. It is written for someone who is trying to understand not just what the backend does, but how the pieces work together, why the project is structured this way, and how to reason about changes safely.

The goal is that a developer who reads this once should be able to:

- explain the backend architecture to someone else
- trace a request from frontend to database and back
- understand where authentication and authorization are enforced
- know the purpose of each controller and model
- identify the best place to make backend changes

## 1. Backend Purpose

`backendApi` is an ASP.NET Core Web API that powers a pharmacy-style application.

At a business level, it supports five main workflows:

1. user account management
2. browsing and managing medicine products
3. cart management
4. prescription handling
5. order management

The backend is stateful around business data, but stateless at the HTTP layer except for authentication tokens stored client-side or in cookies.

## 2. Technology Stack

The project is built with:

- ASP.NET Core Web API for HTTP endpoints
- Entity Framework Core for ORM/database access
- PostgreSQL as the database
- JWT for authentication
- cookie fallback for auth token transport

This stack matters because it shapes where different responsibilities live:

- ASP.NET Core handles routing, middleware, auth, DI, and controller execution
- EF Core handles entity mapping and SQL generation
- JWT allows the backend to authenticate requests without server-side session storage

## 3. Mental Model of the Architecture

A good way to understand this backend is as four layers:

### Layer 1: HTTP Layer

Files involved:

- `Program.cs`
- `Controllers/*.cs`
- middleware classes

Responsibilities:

- receive requests
- apply middleware
- authenticate user
- authorize access
- route the request to the correct controller action

### Layer 2: Application Logic Layer

Files involved:

- `Services/*.cs`

Responsibilities:

- business rules
- validation that spans multiple entities
- orchestration across cart, products, prescriptions, and orders
- creating or updating domain data in the correct sequence

### Layer 3: Data Access Layer

Files involved:

- `Repositories/*.cs`
- `Data/ApplicationDbContext.cs`
- `Configurations/*.cs`

Responsibilities:

- map entities to database tables
- query and update persistent data
- define relationships and constraints

### Layer 4: Domain/Data Model Layer

Files involved:

- `Models/*.cs`
- `DTOs/*.cs`

Responsibilities:

- entities represent persisted database state
- DTOs represent HTTP request and response contracts

## 4. Request Lifecycle

Almost every request follows this general sequence:

1. A client sends an HTTP request.
2. ASP.NET Core routing finds the controller action.
3. Middleware runs in order.
4. Authentication checks the JWT token.
5. Authorization checks attributes like `[Authorize]` or `[Authorize(Roles = "ADMIN")]`.
6. The controller action runs.
7. The controller calls a service or directly uses `ApplicationDbContext`.
8. Business logic validates the request and modifies data if needed.
9. The controller returns a DTO or a simple JSON response.
10. If an exception is thrown, the global exception middleware formats a friendly error response.

This is important because bugs are often easiest to locate by asking:

- did the request reach the controller?
- did auth block it?
- did a service validation fail?
- did the database reject the write?

## 5. Startup in `Program.cs`

`Program.cs` is the composition root of the backend. It does not contain business logic, but it decides which infrastructure pieces exist and how they are wired together.

Main responsibilities:

- creates the web application builder
- registers services and repositories
- configures controllers
- configures database connection
- configures authentication and authorization
- configures CORS
- configures OpenAPI/Swagger in development
- configures static file serving for uploads
- maps controller routes

### Why Startup Matters

If a controller cannot resolve a service, the first place to check is `Program.cs`.

If auth does not work, `Program.cs` is one of the first files to inspect.

If the frontend cannot call the API because of browser restrictions, `Program.cs` is where the CORS policy is defined.

### Services Registered There

The following abstractions are registered for dependency injection:

- `IUserService`
- `IProductRepository`
- `ICartRepository`
- `IOrderRepository`
- `IProductService`
- `ICartService`
- `IPrescriptionService`
- `IOrderService`

This means controllers do not manually create dependencies. ASP.NET Core injects them automatically.

## 6. Dependency Injection in Plain Terms

Dependency injection means classes ask for what they need in their constructors instead of creating those dependencies themselves.

Example idea:

- `OrdersController` needs `IOrderService`
- it does not say `new OrderService(...)`
- ASP.NET Core provides the correct implementation at runtime

Benefits:

- easier testing
- cleaner separation of concerns
- controllers stay simple
- implementation can change without changing consumers

## 7. Authentication: What the Backend Trusts

The backend uses JWT bearer authentication.

That means a request is considered authenticated if the backend can validate the token and extract trusted claims from it.

### What the JWT Must Satisfy

The backend checks:

- issuer
- audience
- expiration time
- signing key

If any of these checks fail, the token is rejected and the request behaves like an unauthenticated request.

### Token Sources

The project supports two ways to receive the JWT:

1. from the standard `Authorization` header
2. from the `auth_token` cookie

This dual-mode setup is useful because:

- API testing tools often use bearer headers
- browser-based frontend flows often prefer cookies

### Why the Cookie Is HTTP-Only

The auth cookie is `HttpOnly`, which reduces JavaScript access to the token in the browser. This is a security improvement because it lowers exposure to token theft via client-side scripts.

## 8. Authorization: What the User Is Allowed to Do

Authentication only confirms identity. Authorization confirms permission.

This backend uses three broad access patterns:

### Pattern A: Public Endpoints

Examples:

- product listing
- product detail
- register/login

These do not require a logged-in user.

### Pattern B: Authenticated User Endpoints

Examples:

- cart operations
- order placement
- order retrieval
- prescription upload

These require a valid authenticated user.

### Pattern C: Admin-Only Endpoints

Examples:

- `AdminController`
- prescription review
- order status progression

These require the user to have the `ADMIN` role.

## 9. Ownership Checks

This backend does something important in addition to role checks: it validates ownership.

Example:

- a normal user may be authenticated
- but that does not mean they can access every user’s cart

So many controllers do this pattern:

1. read the authenticated user id from claims
2. compare it with the `userId` inside the route or body
3. allow the action only if they match or the caller is an admin

This is a critical security pattern throughout the project.

## 10. `ControllerAuthExtensions`

`backendApi/Controllers/ControllerAuthExtensions.cs` exists to avoid repeating claim-parsing logic in every controller.

It provides:

- `GetAuthenticatedUserId()`
- `IsAdmin()`

### Why This Helper Exists

Without it, each controller would need to duplicate:

- claim lookups
- parsing logic
- role checks

Using shared helpers improves consistency and reduces subtle access-control bugs.

## 11. Controllers Overview

Controllers are not where the deepest business logic should live. Their job is to:

- accept HTTP requests
- validate basic access
- translate request data into service calls
- return structured HTTP responses

The project currently has these main controllers:

- `UsersController`
- `ProductsController`
- `CartController`
- `OrdersController`
- `PrescriptionsController`
- `AdminController`

The next sections explain each one in more detail.

## 12. `UsersController`

File:

- `backendApi/Controllers/UsersController.cs`

Purpose:

- register a new user
- authenticate a user
- log a user out

### Endpoints

- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/users/logout`

### Responsibilities

- validate incoming request models
- call the user service
- translate service results into HTTP success or failure responses
- set or remove the auth cookie

### Register Flow

Expected behavior:

1. client sends registration data
2. controller checks `ModelState`
3. service validates business rules, such as uniqueness or password handling
4. controller returns `CreatedAtAction` on success

### Login Flow

Expected behavior:

1. client sends email and password
2. controller checks `ModelState`
3. service verifies credentials
4. service generates JWT token
5. controller sets the `auth_token` cookie
6. controller returns token and user data

### Logout Flow

Expected behavior:

1. controller clears the auth cookie
2. response returns success

### Design Notes

- `UsersController` does not implement hashing or token creation itself
- those tasks belong in the service layer

## 13. `ProductsController`

File:

- `backendApi/Controllers/ProductsController.cs`

Purpose:

- expose catalog data to the frontend

### Endpoints

- `GET /api/products`
- `GET /api/products/{id}`

### Behavior

This controller is intentionally small because product reading is straightforward:

- get all products
- get one product

It delegates to `IProductService`, which keeps the controller simple and reusable.

### Why This Is Public

Product browsing is usually allowed before login in ecommerce/pharmacy systems, so these routes are not protected by `[Authorize]`.

## 14. `CartController`

File:

- `backendApi/Controllers/CartController.cs`

Purpose:

- add product to cart
- read cart
- update quantity
- remove item

### Endpoints

- `POST /api/cart/add`
- `GET /api/cart/{userId}`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove`

### Security Behavior

All routes are protected with `[Authorize]`.

Then each action checks ownership:

- if current user id matches request user id, allow
- if current user is admin, also allow
- otherwise return `Forbid()`

### Cart Design Detail

The cart is stored in a `Cart` entity, but cart items are stored as JSON text in the `CartItems` column. That means:

- the backend must serialize and deserialize cart contents
- cart item changes are not represented as separate rows
- this design is simpler to start with, but less relational than a dedicated `CartItem` table

### Practical Trade-Off

Pros:

- fewer tables
- simpler schema for a small app

Cons:

- harder to query cart items with SQL
- harder to enforce relational constraints per cart item

## 15. `OrdersController`

File:

- `backendApi/Controllers/OrdersController.cs`

Purpose:

- place orders
- fetch one order
- fetch all orders for a user
- update order status
- cancel an order

### Endpoints

- `POST /api/orders`
- `GET /api/orders/{id}`
- `GET /api/orders/user/{id}`
- `PUT /api/orders/{id}/status`
- `PUT /api/orders/{id}/cancel`

### Why Orders Are Important

This controller is the entry point into one of the most business-critical flows: checkout.

Placing an order typically requires the backend to coordinate:

- cart data
- product inventory
- prescription rules
- order creation
- order item creation
- status history creation

### Access Rules

- placing and viewing orders requires login
- users can only view their own orders unless they are admins
- updating order status is admin-only
- cancellation can be allowed to the user or admin depending on business rules in the service layer

## 16. `PrescriptionsController`

File:

- `backendApi/Controllers/PrescriptionsController.cs`

Purpose:

- upload prescription references
- upload prescription files
- fetch prescriptions for a specific user
- review prescriptions

### Endpoints

- `POST /api/prescriptions/upload`
- `POST /api/prescriptions/upload-image`
- `GET /api/prescriptions/{userId}`
- `PUT /api/prescriptions/{id}/review`

### Two Upload Styles

The backend supports:

1. URL-based upload using `Upload`
2. file-based upload using `UploadImage`

The second one is more practical for a browser UI because it accepts multipart form data and saves the actual uploaded file.

### File Upload Flow

When using `upload-image`:

1. user must be authenticated
2. backend validates that a file was sent
3. backend validates MIME type
4. backend validates file size
5. backend creates the `Uploads` directory if missing
6. backend writes the file to disk
7. backend creates a public `/uploads/...` URL
8. backend stores a `Prescription` record in the database

### Review Flow

The review endpoint is admin-only.

It allows an admin to:

- approve a prescription
- reject a prescription

The controller also stamps `ReviewedBy` using the authenticated admin id.

## 17. `AdminController`

File:

- `backendApi/Controllers/AdminController.cs`

Purpose:

- manage categories
- manage products
- manage inventory
- manage users
- view all orders

### Why It Is Separate

Instead of scattering admin-only routes across multiple places, the project centralizes many admin workflows into one controller. This makes it easier to understand the admin surface area.

### Endpoint Groups

- categories
- products
- inventory
- users
- orders

### Design Detail

Unlike some other controllers, `AdminController` talks directly to `ApplicationDbContext` instead of going through dedicated services. That is acceptable for a smaller project, but it means:

- controller logic is a bit heavier
- business rules are less centralized
- future scaling might benefit from moving some admin logic into services

## 18. Middleware

Middleware is code that runs before and after controller actions.

Important middleware and pipeline stages in this project:

- HTTPS redirection
- global exception middleware
- CORS policy
- static files
- authentication
- authorization
- controller endpoint mapping

### Global Exception Middleware

This middleware is important because controllers and services can throw exceptions without manually formatting every error response.

That gives the API:

- cleaner controller code
- centralized error response handling
- more consistent error JSON for frontend consumers

## 19. Static File Serving

Prescription files are uploaded to a physical `Uploads` directory inside the backend project root.

Then ASP.NET Core serves those files at a public request path:

- file system path: `backendApi/Uploads/...`
- URL path: `/uploads/...`

This means database records do not store raw file bytes. They store the generated URL, which is lighter and simpler.

## 20. CORS Behavior

The backend allows cross-origin requests from:

- `http://localhost:4200`

This is configured as the `FrontendDev` CORS policy.

Why it matters:

- Angular dev server runs on a different port than the API
- browsers block cross-origin requests unless the server allows them

Without this CORS policy, the frontend would fail even if the backend endpoints themselves were correct.

## 21. Data Model Overview

The domain model centers on a few core concepts:

- users
- products
- categories
- cart
- prescriptions
- orders
- inventory

These are not isolated tables. They form a graph of business relationships.

## 22. `User` Model

File:

- `backendApi/Models/User.cs`

Meaning:

- represents one account in the system

Important fields:

- `Id`: primary key
- `Name`: display name
- `Email`: unique identity for login purposes
- `PasswordHash`: hashed password, not plain text
- `Role`: authorization role
- `CreatedAt`: account creation time

Relationships:

- one user has many `Orders`
- one user has many `Prescriptions`
- one user has one `Cart`

Why this model matters:

- almost every authenticated flow eventually depends on `User`

## 23. `Category` Model

File:

- `backendApi/Models/Category.cs`

Meaning:

- groups products into logical categories

Important fields:

- `Id`
- `Name`

Relationships:

- one category contains many products

Why it matters:

- admin product management depends on categories
- the frontend may use categories for filtering or display grouping

## 24. `Product` Model

File:

- `backendApi/Models/Product.cs`

Meaning:

- represents a sellable medicine or item

Important fields:

- `Id`
- `Name`
- `CategoryId`
- `Price`
- `Dosage`
- `Packaging`
- `RequiresPrescription`
- `CreatedAt`

Relationships:

- belongs to one `Category`
- has one `Inventory`

Why `RequiresPrescription` Matters

This boolean is not just UI metadata. It influences checkout rules. If a product requires a prescription, order logic must validate that the request includes an allowed prescription reference.

## 25. `Inventory` Model

File:

- `backendApi/Models/Inventory.cs`

Meaning:

- tracks available stock for a product

Important fields:

- `ProductId`
- `Quantity`
- `UpdatedAt`

Why separate inventory from product?

This separation keeps pricing/catalog data distinct from stock data. That can be useful because inventory changes much more often than product metadata.

## 26. `Prescription` Model

File:

- `backendApi/Models/Prescription.cs`

Meaning:

- represents a prescription uploaded by a user

Important fields:

- `Id`
- `UserId`
- `FileUrl`
- `Status`
- `ReviewedBy`
- `CreatedAt`

Status lifecycle:

- `Pending`
- `Approved`
- `Rejected`

Why this model exists:

- some medicines require proof before checkout
- admin review may be part of compliance or moderation workflow

## 27. `Cart` Model

File:

- `backendApi/Models/Cart.cs`

Meaning:

- represents a shopping cart for a single user

Important fields:

- `Id`
- `UserId`
- `CartItems`
- `CreatedAt`

Important implementation detail:

- `CartItems` is stored as a JSON string

This means the backend treats the cart as a document-like blob stored inside one relational row.

## 28. `Order` Model

File:

- `backendApi/Models/Order.cs`

Meaning:

- represents a completed checkout request

Important fields:

- `Id`
- `UserId`
- `PrescriptionId`
- `TotalAmount`
- `Status`
- `CreatedAt`

Relationships:

- belongs to one user
- optionally references one prescription
- owns many order items
- owns many status history rows

Why the optional `PrescriptionId`?

Not every order contains restricted medicines, so the order must support both:

- normal orders with no prescription
- prescription-linked orders

## 29. `OrderItem` Model

File:

- `backendApi/Models/OrderItem.cs`

Meaning:

- one product line inside an order

Important fields:

- `OrderId`
- `ProductId`
- `Quantity`
- `Price`

Why store `Price` here?

Because product prices can change later. An old order should still reflect the price at the time it was placed.

## 30. `OrderStatusHistory` Model

File:

- `backendApi/Models/OrderStatusHistory.cs`

Meaning:

- audit/history record of order state changes

Important fields:

- `OrderId`
- `Status`
- `UpdatedAt`

Why keep history instead of only the current status?

- allows timeline display
- supports auditability
- shows progression of delivery

## 31. Enums

File:

- `backendApi/Models/Enums.cs`

Defined enums:

- `UserRole`
- `PrescriptionStatus`
- `OrderStatus`

These enums are important because they encode allowed states directly in code instead of relying on arbitrary strings everywhere.

Benefits:

- safer updates
- fewer typos
- easier validation
- easier mapping to DTOs or UI labels

## 32. `ApplicationDbContext`

File:

- `backendApi/Data/ApplicationDbContext.cs`

Purpose:

- central EF Core context for the whole backend

It declares `DbSet<>`s for:

- `Users`
- `Categories`
- `Products`
- `Inventories`
- `Prescriptions`
- `Carts`
- `Orders`
- `OrderItems`
- `OrderStatusHistories`

### What `DbSet<>` Means

Each `DbSet<>` acts like a typed access point to a table. EF Core uses it for querying and saving entities.

### Relationships Defined Here

- category to products
- product to inventory
- user to orders
- user to prescriptions
- user to cart
- order to order items
- order to status history

### Why Context Configuration Matters

If relationships are misconfigured, problems can appear as:

- missing related data
- unexpected delete behavior
- wrong foreign keys
- poor query shapes

## 33. Entity Configurations

Although not the main focus of this document, the `Configurations` folder is important because it defines how models map to the database schema.

That typically includes:

- table names
- column names
- constraints
- relationships
- data type rules

This project also uses explicit configuration classes, which is cleaner than putting all mapping logic inside model attributes.

## 34. DTOs: Why Entities Are Not Returned Directly

Entities describe how data lives in the database.

DTOs describe how data moves across the API boundary.

These are different concerns.

Why not just return entity classes directly?

- entities may contain fields the frontend should not see
- entities may have navigation properties that cause over-serialization
- request/response shapes should be optimized for clients
- API contracts should be stable even if database internals change

## 35. Main DTO Groups

Files:

- `backendApi/DTOs/PharmacyDtos.cs`
- `backendApi/DTOs/AdminDtos.cs`

### In `PharmacyDtos.cs`

Key DTOs include:

- `ProductDto`
- `CartItemDto`
- `CartItemResponseDto`
- `CartDto`
- `OrderItemDto`
- `OrderStatusHistoryDto`
- `OrderDto`
- `CartAddRequest`
- `CartUpdateRequest`
- `CartRemoveRequest`
- `UploadPrescriptionRequest`
- `ReviewPrescriptionRequest`
- `PlaceOrderRequest`
- `UpdateOrderStatusRequest`

### In `AdminDtos.cs`

Key DTOs include:

- `CreateProductRequest`
- `UpdateProductRequest`
- `UpdateInventoryRequest`
- `CreateCategoryRequest`
- `UpdateUserRoleRequest`
- `AdminUserDto`
- `CategoryDto`
- `AdminOrderDto`

## 36. Service Layer Responsibilities

The service layer is where the real business decisions should live.

Examples of service-level logic:

- whether login credentials are valid
- whether stock is sufficient
- whether a prescription is required
- whether an order can transition to a certain state
- how cart updates are serialized and stored

This layer is the best place for logic that is:

- shared by multiple endpoints
- non-trivial
- rule-heavy
- easier to test outside HTTP concerns

## 37. Repository Layer Responsibilities

The repository layer exists for some domains such as products, carts, and orders.

Repositories are useful when you want:

- reusable database operations
- less EF Core code inside services
- a clearer abstraction over persistence

This project uses a mixed style:

- some flows use repositories
- some admin flows use `ApplicationDbContext` directly

That is common in evolving projects, but it is good to know that architectural consistency is not absolute here.

## 38. Order Placement Flow in Detail

This is one of the most important flows in the backend.

When `POST /api/orders` is called, the backend needs to answer several questions:

1. Is the user authenticated?
2. Is the user allowed to place an order for this `userId`?
3. Which cart items are being checked out?
4. Do the referenced products exist?
5. Is enough inventory available?
6. Do any products require a prescription?
7. If so, is a valid prescription attached?
8. Can the system create the order and deduct stock safely?

This flow is business-critical because it combines correctness, security, and data consistency.

### Why It Usually Needs a Transaction

Order creation often involves multiple writes:

- insert order
- insert order items
- insert status history
- update stock
- maybe clear cart items

If one write succeeds and another fails, the system can become inconsistent unless the operation is transactional.

## 39. Prescription Flow in Detail

Prescription handling is a cross-cutting feature because it touches:

- user uploads
- file storage
- order validation
- admin review
- admin order visibility

The typical lifecycle is:

1. user uploads file
2. backend saves file
3. backend creates `Prescription` row
4. order flow references that prescription
5. admin may later approve or reject it
6. order/admin views can display prescription status and file URL

This is a good example of why the backend stores metadata in the database and the actual file on disk.

## 40. Order Status Lifecycle

Orders use the `OrderStatus` enum.

Typical lifecycle:

1. `Placed`
2. `Confirmed`
3. `Packed`
4. `Shipped`
5. `OutForDelivery`
6. `Delivered`

Exceptional case:

- `Cancelled`

Why model this as an enum plus history?

- the enum gives the current state
- history preserves transitions over time

## 41. Admin Data Needs vs User Data Needs

The backend distinguishes between normal-user views and admin views.

Example:

- a normal user order response may focus on their own order details
- an admin order response includes user name, email, prescription metadata, item list, and status history

This is why `AdminOrderDto` exists separately from `OrderDto`.

The admin panel and the customer-facing frontend do not need identical data shapes.

## 42. Error Handling Philosophy

The backend generally returns:

- `BadRequest` for invalid inputs or failed business conditions
- `Unauthorized` when there is no valid authenticated identity
- `Forbid` when the identity exists but lacks permission
- `NotFound` when the requested resource does not exist

This distinction matters.

For example:

- `Unauthorized` means "you are not logged in correctly"
- `Forbid` means "you are logged in, but not allowed"

That difference is useful for both debugging and frontend UX.

## 43. Common Change Scenarios

When changing backend behavior, here is where to look first.

### If You Need to Change Login Rules

Start with:

- `UsersController`
- user service implementation
- JWT config in `Program.cs`

### If You Need to Change Product Fields

Start with:

- `Models/Product.cs`
- DTOs that expose product data
- `AdminController`
- product service/repository
- EF configuration/migrations if schema changes are needed

### If You Need to Change Cart Behavior

Start with:

- `CartController`
- cart service
- cart repository
- cart model serialization behavior

### If You Need to Change Checkout Rules

Start with:

- `OrdersController`
- order service
- product/prescription validation logic
- order-related DTOs

### If You Need to Change Prescription Rules

Start with:

- `PrescriptionsController`
- prescription service
- order validation logic
- `PrescriptionStatus` enum if state changes are required

## 44. Why Some Logic Lives in Controllers Today

In an ideal layered architecture, almost all non-trivial business logic lives in services.

In this project, most user-facing logic follows that pattern, but `AdminController` contains more direct data access and response shaping than some teams would prefer.

That is not necessarily wrong, but it means:

- admin logic may be harder to reuse elsewhere
- controllers can grow larger over time
- future refactoring may move some logic into services

For onboarding, the important thing is to know that both styles exist in this codebase.

## 45. Security Notes

A few security-relevant observations from this design:

- JWT validation is configured centrally
- cookies are HTTP-only
- controllers use role-based and ownership-based checks
- uploaded files are validated for type and size
- admin endpoints are separated clearly

Potential areas to watch in future improvements:

- stricter file content validation beyond MIME type
- rate limiting for auth endpoints
- audit logging for admin actions
- more explicit role claim normalization if role naming changes

## 46. Performance Notes

The project is reasonable for a hackathon or moderate-sized application, but a developer should be aware of likely scaling concerns:

- cart items stored as JSON can become awkward for heavy querying
- some admin queries eagerly include related collections
- product and order queries may grow in cost with more data
- serving uploaded files from the app process is simple but not ideal for very large scale

These are not immediate problems, but they are useful context for future evolution.

## 47. Suggested Reading Order for New Developers

If someone is brand new to the backend, this reading order is practical:

1. `backendApi/Program.cs`
2. `backendApi/Controllers/UsersController.cs`
3. `backendApi/Controllers/ControllerAuthExtensions.cs`
4. `backendApi/Data/ApplicationDbContext.cs`
5. `backendApi/Models/*.cs`
6. `backendApi/DTOs/*.cs`
7. `backendApi/Controllers/OrdersController.cs`
8. `backendApi/Controllers/CartController.cs`
9. `backendApi/Controllers/PrescriptionsController.cs`
10. service implementations in `backendApi/Services`

This order works well because it moves from framework setup to domain understanding to core business workflows.

## 48. Fast Summary

If you only remember a few things about this backend, remember these:

- `Program.cs` wires together the app, auth, CORS, static files, and DI
- controllers define the HTTP surface
- services contain business rules
- models represent database state
- DTOs represent API contracts
- `ApplicationDbContext` maps the system to PostgreSQL
- auth is a combination of JWT validation, controller attributes, and ownership checks
- order and prescription flows are the most interconnected parts of the system

## 49. Final Mental Model

Think of the backend as answering three questions for every request:

1. Who is making the request?
2. Are they allowed to do this?
3. What business changes should happen safely in the database?

In this project:

- authentication answers question 1
- authorization answers question 2
- services and EF Core answer question 3

That is the core idea behind how the backend is designed.
