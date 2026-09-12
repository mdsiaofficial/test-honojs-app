const test1 = {
  name : "ashiq",
  age : 26,
  job: {
    title: "swe",
    company: "codestudio",
  }
}

console.log(test1);

const test2 = {...test1};

test2.age = 27;
test2.job.title = "se";
console.log(test2);
console.log(test1);


const test3 = test1;
test3.age=29;
test3.job.company = "cs4";

console.log(test3);
console.log(test1);

const test4 = structuredClone (test1);
test4.age=30;
test4.job.company = "cs";
console.log(test4);
console.log(test1);

