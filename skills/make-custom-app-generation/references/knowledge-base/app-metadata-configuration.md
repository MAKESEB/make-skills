# Metadata Configuration (metadata.json)

## Overview

The `metadata.json` file contains basic information about your Make app, including its name, description, author, and configuration settings. This file is required and defines how your app appears in the Make platform.

## Required Fields

Every `metadata.json` file must include these fields:

```json
{
    "name": "app-name",
    "label": "App Display Name",
    "description": "Brief description of what the app does",
    "version": 1,
    "author": "Your Name or Company",
    "url": "https://yourservice.com",
    "theme": "#667eea",
    "language": "en",
    "audience": "global"
}
```

## Field Descriptions

### Required Fields

- **name**: Unique identifier for your app (lowercase, hyphens only)
- **label**: Display name shown to users
- **description**: Brief explanation of app functionality
- **version**: Integer version number (increment when updating)
- **author**: Developer or company name
- **url**: Website URL for your service
- **theme**: Hex color code for app theming
- **language**: ISO language code (e.g., "en", "es", "fr")
- **audience**: Target audience ("global", "private", "global")

### Optional Fields

- **countries**: Array of country codes where app is available
- **tags**: Array of descriptive tags for categorization
- **category**: App category classification
- **support**: Support contact information
- **documentation**: Link to app documentation

## Basic Examples

### Simple App Configuration
```json
{
    "name": "simple-crm",
    "label": "Simple CRM",
    "description": "Manage contacts and deals in your CRM system",
    "version": 1,
    "author": "CRM Solutions Inc.",
    "url": "https://simplecrm.com",
    "theme": "#2563eb",
    "language": "en",
    "audience": "global"
}
```

### Multi-Language App
```json
{
    "name": "global-ecommerce",
    "label": "Global E-commerce",
    "description": "Manage your online store with multi-language support",
    "version": 2,
    "author": "E-commerce Solutions",
    "url": "https://globalecommerce.com",
    "theme": "#059669",
    "language": "en",
    "audience": "global",
    "countries": ["US", "CA", "GB", "AU", "DE", "FR", "ES"]
}
```

## Advanced Configuration

### Enterprise App with Full Metadata
```json
{
    "name": "enterprise-workflow",
    "label": "Enterprise Workflow Manager",
    "description": "Advanced workflow automation for enterprise teams with comprehensive project management features",
    "version": 3,
    "author": "Enterprise Solutions Corp",
    "url": "https://enterprise-workflow.com",
    "theme": "#7c3aed",
    "language": "en",
    "audience": "global",
    "countries": ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE"],
    "tags": ["workflow", "project-management", "enterprise", "automation"],
    "category": "productivity",
    "support": {
        "email": "support@enterprise-workflow.com",
        "url": "https://enterprise-workflow.com/support",
        "phone": "+1-800-123-4567"
    },
    "documentation": "https://docs.enterprise-workflow.com/make-integration"
}
```

### Regional App Configuration
```json
{
    "name": "eu-banking",
    "label": "EU Banking Integration",
    "description": "Connect with European banking APIs for payment processing",
    "version": 1,
    "author": "FinTech Solutions EU",
    "url": "https://eu-banking.com",
    "theme": "#dc2626",
    "language": "en",
    "audience": "global",
    "countries": ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH"],
    "tags": ["banking", "payments", "fintech", "europe"],
    "category": "finance",
    "compliance": {
        "gdpr": true,
        "pci_dss": true,
        "regulations": ["PSD2", "GDPR", "MiFID II"]
    }
}
```

## Real-World Examples

### CRM Integration
```json
{
    "name": "sales-crm",
    "label": "Sales CRM Pro",
    "description": "Comprehensive CRM integration for sales teams with lead management, deal tracking, and customer analytics",
    "version": 4,
    "author": "SalesTech Solutions",
    "url": "https://salescrmpro.com",
    "theme": "#ea580c",
    "language": "en",
    "audience": "global",
    "countries": ["US", "CA", "GB", "AU"],
    "tags": ["crm", "sales", "leads", "customers", "analytics"],
    "category": "sales",
    "pricing": {
        "model": "subscription",
        "tiers": ["starter", "professional", "enterprise"]
    }
}
```

### E-commerce Platform
```json
{
    "name": "shopify-plus",
    "label": "Shopify Plus Integration",
    "description": "Advanced Shopify integration with inventory management, order processing, and customer data sync",
    "version": 2,
    "author": "E-commerce Automation Ltd",
    "url": "https://shopify-plus-integration.com",
    "theme": "#16a34a",
    "language": "en",
    "audience": "global",
    "countries": ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK"],
    "tags": ["ecommerce", "shopify", "inventory", "orders", "customers"],
    "category": "ecommerce",
    "integrations": ["shopify", "stripe", "paypal", "klaviyo", "mailchimp"]
}
```

### Marketing Automation
```json
{
    "name": "marketing-automation",
    "label": "Marketing Automation Suite",
    "description": "Complete marketing automation with email campaigns, lead scoring, and customer journey mapping",
    "version": 5,
    "author": "MarketingTech Corp",
    "url": "https://marketing-automation-suite.com",
    "theme": "#db2777",
    "language": "en",
    "audience": "global",
    "tags": ["marketing", "automation", "email", "campaigns", "analytics"],
    "category": "marketing",
    "features": [
        "email-campaigns",
        "lead-scoring",
        "customer-journeys",
        "analytics",
        "a-b-testing"
    ]
}
```

## Theme Color Guidelines

### Popular Color Schemes
```json
// Blue (Professional)
"theme": "#2563eb"

// Green (Success/Growth)
"theme": "#059669"

// Purple (Creative)
"theme": "#7c3aed"

// Orange (Energy)
"theme": "#ea580c"

// Red (Important/Alert)
"theme": "#dc2626"

// Teal (Modern)
"theme": "#0891b2"

// Indigo (Tech)
"theme": "#4f46e5"

// Pink (Creative/Fun)
"theme": "#db2777"
```

### Brand-Specific Colors
```json
// Stripe
"theme": "#635bff"

// Shopify
"theme": "#00d4aa"

// Slack
"theme": "#4a154b"

// HubSpot
"theme": "#ff7a59"

// Salesforce
"theme": "#00a1e0"

// Mailchimp
"theme": "#ffe01b"
```

## Audience Configuration

### global Apps
```json
{
    "audience": "global",
    "description": "Available to all Make users globally"
}
```

### Private Apps
```json
{
    "audience": "private",
    "description": "Available only to specific organizations"
}
```

### Global Apps
```json
{
    "audience": "global",
    "countries": ["US", "CA", "GB", "AU", "DE", "FR", "ES"],
    "description": "Available globally with regional customization"
}
```

## Country Code Examples

### North America
```json
"countries": ["US", "CA", "MX"]
```

### Europe
```json
"countries": ["GB", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI"]
```

### Asia Pacific
```json
"countries": ["AU", "NZ", "JP", "SG", "HK", "IN", "KR"]
```

### Global Coverage
```json
"countries": [
    "US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH", 
    "SE", "NO", "DK", "FI", "JP", "SG", "HK", "IN", "KR", "BR", "MX", "AR"
]
```

## Version Management

### Version Strategy
```json
{
    "version": 1,    // Initial release
    "version": 2,    // Minor updates/new features
    "version": 3,    // Major updates/breaking changes
    "version": 4     // Significant architecture changes
}
```

### Version with Changelog
```json
{
    "version": 3,
    "changelog": {
        "v3": "Added webhook support and improved error handling",
        "v2": "Added OAuth 2.0 authentication",
        "v1": "Initial release with basic API integration"
    }
}
```

## Validation Rules

### Name Validation
```json
{
    "name": "valid-app-name",        // ✅ Valid
    "name": "invalid app name",      // ❌ Invalid (spaces)
    "name": "Invalid-App-Name",      // ❌ Invalid (uppercase)
    "name": "invalid_app_name",      // ❌ Invalid (underscores)
    "name": "valid-app-name-2",      // ✅ Valid
    "name": "123-invalid",           // ❌ Invalid (starts with number)
    "name": "valid-app-name-long-but-descriptive"  // ✅ Valid
}
```

### URL Validation
```json
{
    "url": "https://example.com",           // ✅ Valid
    "url": "http://example.com",            // ✅ Valid
    "url": "https://subdomain.example.com", // ✅ Valid
    "url": "example.com",                   // ❌ Invalid (no protocol)
    "url": "ftp://example.com",             // ❌ Invalid (wrong protocol)
    "url": "https://example.com/path"       // ✅ Valid
}
```

## Common Mistakes

### 1. Invalid JSON Syntax
```json
// ❌ Wrong
{
    name: "test-app",
    description: "Test app"
}

// ✅ Correct
{
    "name": "test-app",
    "description": "Test app"
}
```

### 2. Missing Required Fields
```json
// ❌ Wrong - missing required fields
{
    "name": "test-app",
    "label": "Test App"
}

// ✅ Correct - all required fields
{
    "name": "test-app",
    "label": "Test App",
    "description": "A test application",
    "version": 1,
    "author": "Developer",
    "url": "https://example.com",
    "theme": "#667eea",
    "language": "en",
    "audience": "global"
}
```

### 3. Invalid Name Format
```json
// ❌ Wrong formats
{
    "name": "Test App",        // Spaces not allowed
    "name": "Test_App",        // Underscores not allowed
    "name": "TestApp",         // CamelCase not allowed
    "name": "test.app"         // Dots not allowed
}

// ✅ Correct format
{
    "name": "test-app"         // Lowercase with hyphens
}
```

### 4. Invalid Color Format
```json
// ❌ Wrong color formats
{
    "theme": "blue",           // Color names not allowed
    "theme": "#fff",           // Short hex not recommended
    "theme": "rgb(255,0,0)",   // RGB not allowed
    "theme": "#FFFFFF"         // Uppercase not recommended
}

// ✅ Correct color format
{
    "theme": "#667eea"         // Lowercase 6-digit hex
}
```

## Best Practices

1. **Use Descriptive Names**: Make app names clear and searchable
2. **Write Clear Descriptions**: Explain what the app does concisely
3. **Choose Appropriate Colors**: Match your brand or service theme
4. **Include Relevant Tags**: Help users find your app
5. **Set Correct Audience**: Match your app's intended users
6. **Specify Countries**: Limit availability if needed for compliance
7. **Version Consistently**: Increment version numbers logically
8. **Validate JSON**: Always check JSON syntax before deployment
9. **Use Proper URLs**: Include protocol and verify links work
10. **Keep It Updated**: Update metadata when app functionality changes