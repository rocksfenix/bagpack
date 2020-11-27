import sayHello from './say-hello'
import { sum } from './math'

globalThis.setTimeout(() => {
  console.log(sayHello('Santiago'))
}, 1000)

globalThis.setTimeout(() => {
  console.log(sum(2, 7))
}, 4000)
