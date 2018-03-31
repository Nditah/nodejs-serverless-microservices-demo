
const express = require('express');
const router = express.Router();
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore();
const Storage = require('@google-cloud/storage');
const storage = new Storage();

/* displays a new message, creates it if needed */
router.get('/', async (req, res) => {
  const url = req.query.url;
  if(!url) {
    return res.status(400).send('Please provide a URL.');
  }

  let website;

  console.log(`Looking for website ${url}`)

  // Look for this website
  // TODO: use some memcache
  const query = datastore
    .createQuery('Website')
    .filter('url', '=', url);
  const results = await datastore.runQuery(query);
  if(results[0] && results[0].length > 0) {
    // website found
    website = results[0][0];
    console.log(`Website found: ${website.url}`);
  } else {
    console.log(`Website not found: ${url}`);
    // website does not exist, create it

    //make sure it starts with an http or https protocol
    if(!u.startsWith('http://') && !u.startsWith('https://')) {
      url = 'http://' + url;
    }

    const taskKey = datastore.key('Website');
    const newWebsite = {
      key: taskKey,
      data: {
        url: url,
      },
    };
    await datastore.save(newWebsite);
    console.log(`New website saved: ${url}`);
    website = newWebsite.data;
  }

  // retrieve screenshots
  const bucketName = process.env.BUCKET_NAME;
  console.log(`bucketName: ${bucketName}`);
  const urlPath = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const pathPrefix = 'screenshots'
  const options = {
    prefix: `${pathPrefix}/${urlPath}/`,
    delimiter: '/'
  };
  const gcsResults = await storage.bucket(bucketName).getFiles(options)
  const files = gcsResults[0];
  files.map( file => {
    file.url = ` https://storage.googleapis.com/${bucketName}/${file.name}`;
  })
  console.log(`${files.length} screenshots found for ${url}`)

  res.render('website', { website, screenshots: files });
});

module.exports = router;