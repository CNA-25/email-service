# email-service

OBS: Använd bara existerande e-post adresser, tack!

Det går tyvärr inte att testa via Swagger, jag har inte lyckats lösa det problemet (och har knappast tid att göra det längre). REST client fungerar.

## Endpoints

### /invoicing:
Authorization: Bearer [JWT]

to, subject, body, base64

### /newsletter:
Authorization: Bearer [API KEY]

to, subject, body

### /order:
Authorization: Bearer [JWT]

subject, body

### /shipping:
Authorization: Bearer [JWT]

subject, body

### /user:
Authorization: Bearer [API KEY]

to, subject, body
