import { AwsClient } from 'aws4fetch';

const client = new AwsClient({
  accessKeyId: '6114bd13f2af026228196203348ea857',
  secretAccessKey: '78fe752bfafc996bf06e84f618afe1ec38a7e4fc8072f9cc591943daa2124dd4',
  service: 's3',
  region: 'auto',
});

const s3Url = new URL(
  `https://792f338327ff1589cd6f1ff196d0e5bb.r2.cloudflarestorage.com/kontenmu-media`
);

async function main() {
  const objectUrl = new URL(`${s3Url.href}/test-file-${Date.now()}.txt`);
  
  const presignedRequest = await client.sign(objectUrl, {
    method: 'PUT',
    aws: { signQuery: true },
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  console.log('Presigned URL:', presignedRequest.url);
}

main().catch(console.error);
