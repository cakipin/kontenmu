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

    let response = new Response(object.body, { headers });

    // If it's an HTML file, strip SRI integrity attributes to allow dummy SDKs to load without errors
    if (headers.get("Content-Type")?.includes("text/html")) {
      response = new HTMLRewriter()
        .on("script", {
          element(element) {
            if (element.getAttribute("src")?.includes("_sdk/")) {
              element.removeAttribute("integrity");
            }
          },
        })
        .transform(response);
    }

    return response;
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
};
