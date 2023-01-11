---
outline: deep
---

# User Login

This delegate process requested data for login user and make user session if the data was correct.

## Necessary Data in request

the request must be contained

- username:
- password: this must be hashed with.
- cultureName: for selected user language.
- clientIp:
- clientSystem: this is contain client os and browser data.

## Return value

After inspect username and password system generate [User Session](../user-session/) object and send it back.

## Exceptions

- [Username or Password is empty](../exceptions/username-password-not-set.md)
