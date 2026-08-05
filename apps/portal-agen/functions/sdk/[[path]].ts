export const onRequestGet = async (context: any) => {
  // Return an empty JavaScript response to satisfy dummy SDK requests from HTML5 games
  // This prevents MIME type and Subresource Integrity errors in the browser console.
  return new Response("/* dummy sdk */", {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
