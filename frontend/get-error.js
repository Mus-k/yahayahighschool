fetch('http://localhost:3000/en/login')
  .then(res => res.text())
  .then(html => {
    // Next.js injects error boundaries, look for something with "message" or stack traces.
    // Or just look for the first JSON-like string.
    fs = NodeJS.require('fs');
    fs.writeFileSync('error-dump.html', html);
    console.log("Saved to error-dump.html");
  });
