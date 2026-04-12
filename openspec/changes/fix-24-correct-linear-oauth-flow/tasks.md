## 1. Authorization URL correctness

- [x] 1.1 Remove unsupported Linear OAuth scope or parameter values from authorization URL generation.
- [x] 1.2 Verify the generated URL still preserves the required client, redirect, response type, actor, and state inputs.

## 2. Callback and state handling

- [x] 2.1 Keep callback validation single-use and ensure reused or mismatched state errors remain explicit.
- [x] 2.2 Update auth tool responses or helper output so callers know they must pass the newly issued `state` to `linear_auth_callback`.

## 3. Validation and docs

- [x] 3.1 Add tests for authorization URL contents and stale-state rejection.
- [x] 3.2 Update README and auth guidance to describe the corrected Linear OAuth flow.
