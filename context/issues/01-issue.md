1/
1

Next.js 16.3.4
Turbopack
Runtime ReferenceError



GitHub is not defined
auth.ts (19:11) @ module evaluation


  17 |   },
  18 |   providers: [
> 19 |     Google({
     |           ^
  20 |       clientId: process.env.AUTH_GOOGLE_ID,
  21 |       clientSecret: process.env.AUTH_GOOGLE_SECRET,
  22 |       allowDangerousEmailAccountLinking: true,
Call Stack
10

Show 8 ignore-listed frame(s)
module evaluation
auth.ts (19:11)
module evaluation
middleware.ts (4:16)
