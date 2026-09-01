let name1: string = "ashiq";
console.log(name1);

function id1 (name1: string): any {
  return name1+"1";
}
console.log(
  id1("karim")
);

function id2 (name1: string): string {
  return name1+"1";
}
console.log(
  id2("rahim")
);

function identity1 <T> (age: T): T{
  return age;
}

console.log(
  identity1(5)
);

console.log(
  identity1("five")
);