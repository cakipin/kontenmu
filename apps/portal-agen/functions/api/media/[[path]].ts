export const onRequestGet = async (context: any) => {
  try {
    const { MEDIA } = context.env;
    const pathArray = context.params.path;
    if (!pathArray || pathArray.length === 0) {
      return new Response("Not found", { status: 404 });
    }
    const filename = pathArray.join("/");

    const object = await MEDIA.get(filename);

    if (object === null) {
      return new Response("Object Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(object.body, { headers });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
};
