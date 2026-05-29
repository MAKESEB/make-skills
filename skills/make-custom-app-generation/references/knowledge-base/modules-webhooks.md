## Webhooks-01

**Description**
Implements an instant trigger (webhook) that uses a custom JavaScript function to pre-validate incoming data. The scenario only executes if the function returns a truthy value, which filters events at the source and prevents unnecessary runs.

**⚠️ Critical Warnings**
- The custom function (e.g., `checkIfPaymentWasMade`) must be defined in the app's `_functions` section. If it's missing or has a syntax error, the webhook will fail to validate and will not trigger.
- The webhook will only run if the `valid` expression returns a truthy value. Ensure the function logic correctly identifies all desired event types.

**Example**
```json
{
    "_hooks": {
        "newPaymentHook": {
            "label": "New Payment",
            "api": {
                "response": {
                    "valid": "{{checkIfPaymentWasMade(payload)}}",
                    "output": "{{body}}"
                }
            }
        }
    },
    "_functions": {
        "checkIfPaymentWasMade": {
            "code": "function checkIfPaymentWasMade(response) { let paymentFound = false; response.fields.forEach((field) => { if (field.type === \"paypal\" || field.type === \"stripe\") { paymentFound = true; } }); return paymentFound; }",
            "arguments": "(response)"
        }
    }
}
```

**Implementation Steps**
1. In the `_functions` section of your app, define a new function (e.g., `checkIfPaymentWasMade`) with a `code` property containing your JavaScript validation logic. 
2. In the `_hooks` section, define your webhook. 
3. Inside the hook's `api.response` object, set the `valid` property to an IML expression that calls your custom function, e.g., `{{checkIfPaymentWasMade(payload)}}`.

**Real-World Examples**
- `Using `checkIfPaymentWasMade(payload)` to only trigger a scenario when a form submission includes a payment field from PayPal or Stripe.`
- `Using `checkFileUploaded(payload)` to filter for submissions that contain a file upload.`
- `The webhook passes the entire request body as the `payload` or `body` variable, which is then processed by the custom function.`

**Platform Notes**
- The `payload` variable passed to the function represents the entire incoming webhook body.
- Custom functions are written in JavaScript and must be self-contained within the `code` property.
- This pattern requires defining both the webhook in `_hooks` and the corresponding validation logic in `_functions`.

**Source files**
_hooks.aidaform2, _functions.checkIfPaymentWasMade

---

## Webhooks-02

**Description**
Defines an instant trigger (webhook) that uses a custom IML function to conditionally validate and filter incoming payloads. The webhook receives all events, but the 'valid' property in the 'response' block executes a function. A scenario run is initiated only if the function returns a truthy value, which reduces the execution of unnecessary scenarios.

**⚠️ Critical Warnings**
- The webhook endpoint will still receive and process every notification from the source service, which consumes platform resources. The 'valid' condition only prevents the scenario itself from running.
- If the custom function has an error, it may silently fail and prevent valid triggers from starting scenarios. Thorough testing is required.

**Example**
```json
{
    "aidaform2": {
      "api": {
        "response": {
          "valid": "{{checkIfPaymentWasMade(payload)}}",
          "output": "{{body}}"
        }
      },
      "name": "aidaform2",
      "type": "web",
      "label": "New Payment"
    },
    "checkIfPaymentWasMade": {
      "code": "function checkIfPaymentWasMade(response) {\n    let paymentFound = false;\n\n    response.fields.forEach((field) => {\n        if (field.type === \"paypal\" || field.type === \"stripe\") {\n            paymentFound = true;\n        }\n    });\n\n    return paymentFound;\n}",
      "name": "checkIfPaymentWasMade",
      "arguments": "(response)"
    }
}
```

**Implementation Steps**
1. In `_functions`, define a new JavaScript function that accepts the payload and returns `true` or `false` based on your desired logic.
2. In `_hooks`, define a new webhook with `"type": "web"`.
3. In the webhook's `api.response` block, set the `valid` key to an IML expression that calls your function, e.g., `"{{myCustomFunction(payload)}}"`.
4. Set the `output` to `"{{body}}"` to pass the full payload to the scenario if it's valid.
5. In `_modules`, create a new trigger module (`typeId: 10`) and set its `hookName` to the name of the webhook you defined in step 2.

**Real-World Examples**
- `Conditional validation: `"valid": "{{checkIfPaymentWasMade(payload)}}"``
- `Function Logic: A JavaScript function that iterates through a 'fields' array in the webhook payload to check if a field with `type: 'paypal'` or `type: 'stripe'` exists.`

**Platform Notes**
- This pattern requires defining both a webhook in `_hooks` and a corresponding function in `_functions`.
- The trigger module in `_modules` must reference the webhook by its name using the `hookName` property.
- The webhook payload is passed to the custom function as the 'payload' argument.

**Source files**
_hooks.aidaform2 and _functions.checkIfPaymentWasMade

---

