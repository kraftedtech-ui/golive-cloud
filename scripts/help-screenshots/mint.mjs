import { encode } from 'next-auth/jwt'
const [role] = process.argv.slice(2)
console.log(await encode({ token: { email: `${role}@test.local`, name: role, role, id: 'x' }, secret: process.env.S }))
