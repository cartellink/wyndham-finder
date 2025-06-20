function promiseAllStepN(n, list) {
  const tail = list.splice(n);
  const head = list;
  const resolved = [];
  let processed = 0;
  return new Promise(resolve=>{
      head.forEach(x=>{
          const res = x();
          resolved.push(res);
          res.then(y=>{
              runNext();
              return y;
          });
      });
      function runNext(){
          if(processed == tail.length){
              resolve(Promise.all(resolved));
          }else{
              resolved.push(tail[processed]().then(x=>{
                  runNext();
                  return x;
              }));
              processed++;
          }
      }
  });
}
Promise.allConcurrent = n => list =>  promiseAllStepN(n, list);