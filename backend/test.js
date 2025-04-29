const fetch = require('node-fetch');

   (async () => {
     const response = await fetch('http://localhost:3000/ask', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ question: 'Hello!' }),
     });
     console.log(await response.json());
   })();