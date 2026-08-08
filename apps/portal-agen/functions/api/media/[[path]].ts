export const onRequestGet = async (context: any) => {
  try {
    const { MEDIA } = context.env;
    const pathArray = context.params.path;
    if (!pathArray || pathArray.length === 0) {
      return new Response("Not found", { status: 404 });
    }

    // Bypass aggressive edge caching by allowing a virtual path segment
    if (pathArray[0] === "nocache" || pathArray[0] === "v2") {
      pathArray.shift();
    }

    const filename = pathArray.join("/");

    const rangeHeader = context.request.headers.get("Range");
    const options: any = {};
    if (rangeHeader) {
      options.range = context.request.headers;
    }

    const object = await MEDIA.get(filename, options);

    if (object === null) {
      return new Response("Object Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");

    if (rangeHeader && object.range) {
      headers.set(
        "Content-Range",
        `bytes ${object.range.offset}-${
          object.range.offset + object.range.length - 1
        }/${object.size}`
      );
    }

    const status = object.body && rangeHeader ? 206 : 200;
    let response: Response;

    headers.set("x-debug-filename", filename || "none");
    headers.set("x-debug-patharray", JSON.stringify(pathArray));

    // If it's an HTML file, force Content-Type and strip SRI integrity attributes
    if (filename.endsWith(".html")) {
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("x-html-rewriter-ran", "true");
      response = new Response(object.body, { headers, status });
      response = new HTMLRewriter()
        .on("script", {
          element(element) {
            element.setAttribute("data-rewritten", "true");
            const src = element.getAttribute("src");
            if (src?.includes("_sdk/")) {
              element.removeAttribute("integrity");
              element.setAttribute("src", src.replace("_sdk/", "sdk/"));
            }
          },
        })
        .transform(response);
    } else {
      response = new Response(object.body, { headers, status });
    }

    return response;
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
};
