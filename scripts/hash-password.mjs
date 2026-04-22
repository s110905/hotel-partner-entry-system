import bcrypt from 'bcryptjs'

const passwords = ['demo', 'admin']

for (const pwd of passwords) {
  const hash = await bcrypt.hash(pwd, 12)
  console.log(`${pwd} => ${hash}`)
}
