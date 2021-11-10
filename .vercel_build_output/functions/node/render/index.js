var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require3() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob2, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob2 = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob2) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob2([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob2.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob2;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS({
  "node_modules/dayjs/dayjs.min.js"(exports, module2) {
    init_shims();
    !function(t, e) {
      typeof exports == "object" && typeof module2 != "undefined" ? module2.exports = e() : typeof define == "function" && define.amd ? define(e) : (t = typeof globalThis != "undefined" ? globalThis : t || self).dayjs = e();
    }(exports, function() {
      "use strict";
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s2 = "minute", u = "hour", a = "day", o = "week", f = "month", h = "quarter", c = "year", d2 = "date", $ = "Invalid Date", l = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_") }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, g = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date())
          return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, f), s3 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s3 ? -1 : 1), f);
        return +(-(r2 + (n2 - i2) / (s3 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: f, y: c, w: o, d: a, D: d2, h: u, m: s2, s: i, ms: r, Q: h }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return t2 === void 0;
      } }, D = "en", v = {};
      v[D] = M;
      var p = function(t2) {
        return t2 instanceof _;
      }, S = function(t2, e2, n2) {
        var r2;
        if (!t2)
          return D;
        if (typeof t2 == "string")
          v[t2] && (r2 = t2), e2 && (v[t2] = e2, r2 = t2);
        else {
          var i2 = t2.name;
          v[i2] = t2, r2 = i2;
        }
        return !n2 && r2 && (D = r2), r2 || !n2 && D;
      }, w = function(t2, e2) {
        if (p(t2))
          return t2.clone();
        var n2 = typeof e2 == "object" ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, O = g;
      O.l = S, O.i = p, O.w = function(t2, e2) {
        return w(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = function() {
        function M2(t2) {
          this.$L = S(t2.locale, null, true), this.parse(t2);
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (e2 === null)
              return new Date(NaN);
            if (O.u(e2))
              return new Date();
            if (e2 instanceof Date)
              return new Date(e2);
            if (typeof e2 == "string" && !/Z$/i.test(e2)) {
              var r2 = e2.match(l);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s3 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s3)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s3);
              }
            }
            return new Date(e2);
          }(t2), this.$x = t2.x || {}, this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return O;
        }, m2.isValid = function() {
          return !(this.$d.toString() === $);
        }, m2.isSame = function(t2, e2) {
          var n2 = w(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return w(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < w(t2);
        }, m2.$g = function(t2, e2, n2) {
          return O.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!O.u(e2) || e2, h2 = O.p(t2), $2 = function(t3, e3) {
            var i2 = O.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, l2 = function(t3, e3) {
            return O.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, g2 = "set" + (this.$u ? "UTC" : "");
          switch (h2) {
            case c:
              return r2 ? $2(1, 0) : $2(31, 11);
            case f:
              return r2 ? $2(1, M3) : $2(0, M3 + 1);
            case o:
              var D2 = this.$locale().weekStart || 0, v2 = (y2 < D2 ? y2 + 7 : y2) - D2;
              return $2(r2 ? m3 - v2 : m3 + (6 - v2), M3);
            case a:
            case d2:
              return l2(g2 + "Hours", 0);
            case u:
              return l2(g2 + "Minutes", 1);
            case s2:
              return l2(g2 + "Seconds", 2);
            case i:
              return l2(g2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = O.p(t2), h2 = "set" + (this.$u ? "UTC" : ""), $2 = (n2 = {}, n2[a] = h2 + "Date", n2[d2] = h2 + "Date", n2[f] = h2 + "Month", n2[c] = h2 + "FullYear", n2[u] = h2 + "Hours", n2[s2] = h2 + "Minutes", n2[i] = h2 + "Seconds", n2[r] = h2 + "Milliseconds", n2)[o2], l2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === f || o2 === c) {
            var y2 = this.clone().set(d2, 1);
            y2.$d[$2](l2), y2.init(), this.$d = y2.set(d2, Math.min(this.$D, y2.daysInMonth())).$d;
          } else
            $2 && this.$d[$2](l2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[O.p(t2)]();
        }, m2.add = function(r2, h2) {
          var d3, $2 = this;
          r2 = Number(r2);
          var l2 = O.p(h2), y2 = function(t2) {
            var e2 = w($2);
            return O.w(e2.date(e2.date() + Math.round(t2 * r2)), $2);
          };
          if (l2 === f)
            return this.set(f, this.$M + r2);
          if (l2 === c)
            return this.set(c, this.$y + r2);
          if (l2 === a)
            return y2(1);
          if (l2 === o)
            return y2(7);
          var M3 = (d3 = {}, d3[s2] = e, d3[u] = n, d3[i] = t, d3)[l2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return O.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid())
            return n2.invalidDate || $;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = O.z(this), s3 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, f2 = n2.months, h2 = function(t3, n3, i3, s4) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].substr(0, s4);
          }, c2 = function(t3) {
            return O.s(s3 % 12 || 12, t3, "0");
          }, d3 = n2.meridiem || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          }, l2 = { YY: String(this.$y).slice(-2), YYYY: this.$y, M: a2 + 1, MM: O.s(a2 + 1, 2, "0"), MMM: h2(n2.monthsShort, a2, f2, 3), MMMM: h2(f2, a2), D: this.$D, DD: O.s(this.$D, 2, "0"), d: String(this.$W), dd: h2(n2.weekdaysMin, this.$W, o2, 2), ddd: h2(n2.weekdaysShort, this.$W, o2, 3), dddd: o2[this.$W], H: String(s3), HH: O.s(s3, 2, "0"), h: c2(1), hh: c2(2), a: d3(s3, u2, true), A: d3(s3, u2, false), m: String(u2), mm: O.s(u2, 2, "0"), s: String(this.$s), ss: O.s(this.$s, 2, "0"), SSS: O.s(this.$ms, 3, "0"), Z: i2 };
          return r2.replace(y, function(t3, e3) {
            return e3 || l2[t3] || i2.replace(":", "");
          });
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d3, $2) {
          var l2, y2 = O.p(d3), M3 = w(r2), m3 = (M3.utcOffset() - this.utcOffset()) * e, g2 = this - M3, D2 = O.m(this, M3);
          return D2 = (l2 = {}, l2[c] = D2 / 12, l2[f] = D2, l2[h] = D2 / 3, l2[o] = (g2 - m3) / 6048e5, l2[a] = (g2 - m3) / 864e5, l2[u] = g2 / n, l2[s2] = g2 / e, l2[i] = g2 / t, l2)[y2] || g2, $2 ? D2 : O.a(D2);
        }, m2.daysInMonth = function() {
          return this.endOf(f).$D;
        }, m2.$locale = function() {
          return v[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2)
            return this.$L;
          var n2 = this.clone(), r2 = S(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return O.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      }(), b = _.prototype;
      return w.prototype = b, [["$ms", r], ["$s", i], ["$m", s2], ["$H", u], ["$W", a], ["$M", f], ["$y", c], ["$D", d2]].forEach(function(t2) {
        b[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      }), w.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, w), t2.$i = true), w;
      }, w.locale = S, w.isDayjs = p, w.unix = function(t2) {
        return w(1e3 * t2);
      }, w.en = v[D], w.Ls = v, w.p = {}, w;
    });
  }
});

// node_modules/toastify-js/src/toastify.js
var require_toastify = __commonJS({
  "node_modules/toastify-js/src/toastify.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) {
        module2.exports = factory();
      } else {
        root.Toastify = factory();
      }
    })(exports, function(global2) {
      var Toastify = function(options2) {
        return new Toastify.lib.init(options2);
      }, version = "1.11.2";
      Toastify.defaults = {
        oldestFirst: true,
        text: "Toastify is awesome!",
        node: void 0,
        duration: 3e3,
        selector: void 0,
        callback: function() {
        },
        destination: void 0,
        newWindow: false,
        close: false,
        gravity: "toastify-top",
        positionLeft: false,
        position: "",
        backgroundColor: "",
        avatar: "",
        className: "",
        stopOnFocus: true,
        onClick: function() {
        },
        offset: { x: 0, y: 0 },
        escapeMarkup: true,
        style: { background: "" }
      };
      Toastify.lib = Toastify.prototype = {
        toastify: version,
        constructor: Toastify,
        init: function(options2) {
          if (!options2) {
            options2 = {};
          }
          this.options = {};
          this.toastElement = null;
          this.options.text = options2.text || Toastify.defaults.text;
          this.options.node = options2.node || Toastify.defaults.node;
          this.options.duration = options2.duration === 0 ? 0 : options2.duration || Toastify.defaults.duration;
          this.options.selector = options2.selector || Toastify.defaults.selector;
          this.options.callback = options2.callback || Toastify.defaults.callback;
          this.options.destination = options2.destination || Toastify.defaults.destination;
          this.options.newWindow = options2.newWindow || Toastify.defaults.newWindow;
          this.options.close = options2.close || Toastify.defaults.close;
          this.options.gravity = options2.gravity === "bottom" ? "toastify-bottom" : Toastify.defaults.gravity;
          this.options.positionLeft = options2.positionLeft || Toastify.defaults.positionLeft;
          this.options.position = options2.position || Toastify.defaults.position;
          this.options.backgroundColor = options2.backgroundColor || Toastify.defaults.backgroundColor;
          this.options.avatar = options2.avatar || Toastify.defaults.avatar;
          this.options.className = options2.className || Toastify.defaults.className;
          this.options.stopOnFocus = options2.stopOnFocus === void 0 ? Toastify.defaults.stopOnFocus : options2.stopOnFocus;
          this.options.onClick = options2.onClick || Toastify.defaults.onClick;
          this.options.offset = options2.offset || Toastify.defaults.offset;
          this.options.escapeMarkup = options2.escapeMarkup !== void 0 ? options2.escapeMarkup : Toastify.defaults.escapeMarkup;
          this.options.style = options2.style || Toastify.defaults.style;
          if (options2.backgroundColor) {
            this.options.style.background = options2.backgroundColor;
          }
          return this;
        },
        buildToast: function() {
          if (!this.options) {
            throw "Toastify is not initialized";
          }
          var divElement = document.createElement("div");
          divElement.className = "toastify on " + this.options.className;
          if (!!this.options.position) {
            divElement.className += " toastify-" + this.options.position;
          } else {
            if (this.options.positionLeft === true) {
              divElement.className += " toastify-left";
              console.warn("Property `positionLeft` will be depreciated in further versions. Please use `position` instead.");
            } else {
              divElement.className += " toastify-right";
            }
          }
          divElement.className += " " + this.options.gravity;
          if (this.options.backgroundColor) {
            console.warn('DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.');
          }
          for (var property in this.options.style) {
            divElement.style[property] = this.options.style[property];
          }
          if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
            divElement.appendChild(this.options.node);
          } else {
            if (this.options.escapeMarkup) {
              divElement.innerText = this.options.text;
            } else {
              divElement.innerHTML = this.options.text;
            }
            if (this.options.avatar !== "") {
              var avatarElement = document.createElement("img");
              avatarElement.src = this.options.avatar;
              avatarElement.className = "toastify-avatar";
              if (this.options.position == "left" || this.options.positionLeft === true) {
                divElement.appendChild(avatarElement);
              } else {
                divElement.insertAdjacentElement("afterbegin", avatarElement);
              }
            }
          }
          if (this.options.close === true) {
            var closeElement = document.createElement("span");
            closeElement.innerHTML = "&#10006;";
            closeElement.className = "toast-close";
            closeElement.addEventListener("click", function(event) {
              event.stopPropagation();
              this.removeElement(this.toastElement);
              window.clearTimeout(this.toastElement.timeOutValue);
            }.bind(this));
            var width = window.innerWidth > 0 ? window.innerWidth : screen.width;
            if ((this.options.position == "left" || this.options.positionLeft === true) && width > 360) {
              divElement.insertAdjacentElement("afterbegin", closeElement);
            } else {
              divElement.appendChild(closeElement);
            }
          }
          if (this.options.stopOnFocus && this.options.duration > 0) {
            var self2 = this;
            divElement.addEventListener("mouseover", function(event) {
              window.clearTimeout(divElement.timeOutValue);
            });
            divElement.addEventListener("mouseleave", function() {
              divElement.timeOutValue = window.setTimeout(function() {
                self2.removeElement(divElement);
              }, self2.options.duration);
            });
          }
          if (typeof this.options.destination !== "undefined") {
            divElement.addEventListener("click", function(event) {
              event.stopPropagation();
              if (this.options.newWindow === true) {
                window.open(this.options.destination, "_blank");
              } else {
                window.location = this.options.destination;
              }
            }.bind(this));
          }
          if (typeof this.options.onClick === "function" && typeof this.options.destination === "undefined") {
            divElement.addEventListener("click", function(event) {
              event.stopPropagation();
              this.options.onClick();
            }.bind(this));
          }
          if (typeof this.options.offset === "object") {
            var x = getAxisOffsetAValue("x", this.options);
            var y = getAxisOffsetAValue("y", this.options);
            var xOffset = this.options.position == "left" ? x : "-" + x;
            var yOffset = this.options.gravity == "toastify-top" ? y : "-" + y;
            divElement.style.transform = "translate(" + xOffset + "," + yOffset + ")";
          }
          return divElement;
        },
        showToast: function() {
          this.toastElement = this.buildToast();
          var rootElement;
          if (typeof this.options.selector === "string") {
            rootElement = document.getElementById(this.options.selector);
          } else if (this.options.selector instanceof HTMLElement || typeof ShadowRoot !== "undefined" && this.options.selector instanceof ShadowRoot) {
            rootElement = this.options.selector;
          } else {
            rootElement = document.body;
          }
          if (!rootElement) {
            throw "Root element is not defined";
          }
          var elementToInsert = Toastify.defaults.oldestFirst ? rootElement.firstChild : rootElement.lastChild;
          rootElement.insertBefore(this.toastElement, elementToInsert);
          Toastify.reposition();
          if (this.options.duration > 0) {
            this.toastElement.timeOutValue = window.setTimeout(function() {
              this.removeElement(this.toastElement);
            }.bind(this), this.options.duration);
          }
          return this;
        },
        hideToast: function() {
          if (this.toastElement.timeOutValue) {
            clearTimeout(this.toastElement.timeOutValue);
          }
          this.removeElement(this.toastElement);
        },
        removeElement: function(toastElement) {
          toastElement.className = toastElement.className.replace(" on", "");
          window.setTimeout(function() {
            if (this.options.node && this.options.node.parentNode) {
              this.options.node.parentNode.removeChild(this.options.node);
            }
            if (toastElement.parentNode) {
              toastElement.parentNode.removeChild(toastElement);
            }
            this.options.callback.call(toastElement);
            Toastify.reposition();
          }.bind(this), 400);
        }
      };
      Toastify.reposition = function() {
        var topLeftOffsetSize = {
          top: 15,
          bottom: 15
        };
        var topRightOffsetSize = {
          top: 15,
          bottom: 15
        };
        var offsetSize = {
          top: 15,
          bottom: 15
        };
        var allToasts = document.getElementsByClassName("toastify");
        var classUsed;
        for (var i = 0; i < allToasts.length; i++) {
          if (containsClass(allToasts[i], "toastify-top") === true) {
            classUsed = "toastify-top";
          } else {
            classUsed = "toastify-bottom";
          }
          var height = allToasts[i].offsetHeight;
          classUsed = classUsed.substr(9, classUsed.length - 1);
          var offset = 15;
          var width = window.innerWidth > 0 ? window.innerWidth : screen.width;
          if (width <= 360) {
            allToasts[i].style[classUsed] = offsetSize[classUsed] + "px";
            offsetSize[classUsed] += height + offset;
          } else {
            if (containsClass(allToasts[i], "toastify-left") === true) {
              allToasts[i].style[classUsed] = topLeftOffsetSize[classUsed] + "px";
              topLeftOffsetSize[classUsed] += height + offset;
            } else {
              allToasts[i].style[classUsed] = topRightOffsetSize[classUsed] + "px";
              topRightOffsetSize[classUsed] += height + offset;
            }
          }
        }
        return this;
      };
      function getAxisOffsetAValue(axis, options2) {
        if (options2.offset[axis]) {
          if (isNaN(options2.offset[axis])) {
            return options2.offset[axis];
          } else {
            return options2.offset[axis] + "px";
          }
        }
        return "0px";
      }
      function containsClass(elem, yourClass) {
        if (!elem || typeof yourClass !== "string") {
          return false;
        } else if (elem.className && elem.className.trim().split(/\s+/gi).indexOf(yourClass) > -1) {
          return true;
        } else {
          return false;
        }
      }
      Toastify.lib.init.prototype = Toastify.lib;
      return Toastify;
    });
  }
});

// node_modules/@supabase/supabase-js/dist/main/lib/version.js
var require_version = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/lib/version.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "1.22.6";
  }
});

// node_modules/@supabase/supabase-js/dist/main/lib/constants.js
var require_constants = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/lib/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_HEADERS = void 0;
    var version_1 = require_version();
    exports.DEFAULT_HEADERS = { "X-Client-Info": `supabase-js/${version_1.version}` };
  }
});

// node_modules/node-fetch/lib/index.js
var require_lib = __commonJS({
  "node_modules/node-fetch/lib/index.js"(exports, module2) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function _interopDefault(ex) {
      return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
    }
    var Stream2 = _interopDefault(require("stream"));
    var http2 = _interopDefault(require("http"));
    var Url = _interopDefault(require("url"));
    var https2 = _interopDefault(require("https"));
    var zlib2 = _interopDefault(require("zlib"));
    var Readable2 = Stream2.Readable;
    var BUFFER = Symbol("buffer");
    var TYPE = Symbol("type");
    var Blob3 = class {
      constructor() {
        this[TYPE] = "";
        const blobParts = arguments[0];
        const options2 = arguments[1];
        const buffers = [];
        let size = 0;
        if (blobParts) {
          const a = blobParts;
          const length = Number(a.length);
          for (let i = 0; i < length; i++) {
            const element = a[i];
            let buffer;
            if (element instanceof Buffer) {
              buffer = element;
            } else if (ArrayBuffer.isView(element)) {
              buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
            } else if (element instanceof ArrayBuffer) {
              buffer = Buffer.from(element);
            } else if (element instanceof Blob3) {
              buffer = element[BUFFER];
            } else {
              buffer = Buffer.from(typeof element === "string" ? element : String(element));
            }
            size += buffer.length;
            buffers.push(buffer);
          }
        }
        this[BUFFER] = Buffer.concat(buffers);
        let type = options2 && options2.type !== void 0 && String(options2.type).toLowerCase();
        if (type && !/[^\u0020-\u007E]/.test(type)) {
          this[TYPE] = type;
        }
      }
      get size() {
        return this[BUFFER].length;
      }
      get type() {
        return this[TYPE];
      }
      text() {
        return Promise.resolve(this[BUFFER].toString());
      }
      arrayBuffer() {
        const buf = this[BUFFER];
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        return Promise.resolve(ab);
      }
      stream() {
        const readable = new Readable2();
        readable._read = function() {
        };
        readable.push(this[BUFFER]);
        readable.push(null);
        return readable;
      }
      toString() {
        return "[object Blob]";
      }
      slice() {
        const size = this.size;
        const start = arguments[0];
        const end = arguments[1];
        let relativeStart, relativeEnd;
        if (start === void 0) {
          relativeStart = 0;
        } else if (start < 0) {
          relativeStart = Math.max(size + start, 0);
        } else {
          relativeStart = Math.min(start, size);
        }
        if (end === void 0) {
          relativeEnd = size;
        } else if (end < 0) {
          relativeEnd = Math.max(size + end, 0);
        } else {
          relativeEnd = Math.min(end, size);
        }
        const span = Math.max(relativeEnd - relativeStart, 0);
        const buffer = this[BUFFER];
        const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
        const blob = new Blob3([], { type: arguments[2] });
        blob[BUFFER] = slicedBuffer;
        return blob;
      }
    };
    Object.defineProperties(Blob3.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Object.defineProperty(Blob3.prototype, Symbol.toStringTag, {
      value: "Blob",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function FetchError2(message, type, systemError) {
      Error.call(this, message);
      this.message = message;
      this.type = type;
      if (systemError) {
        this.code = this.errno = systemError.code;
      }
      Error.captureStackTrace(this, this.constructor);
    }
    FetchError2.prototype = Object.create(Error.prototype);
    FetchError2.prototype.constructor = FetchError2;
    FetchError2.prototype.name = "FetchError";
    var convert;
    try {
      convert = require("encoding").convert;
    } catch (e) {
    }
    var INTERNALS2 = Symbol("Body internals");
    var PassThrough2 = Stream2.PassThrough;
    function Body2(body) {
      var _this = this;
      var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
      let size = _ref$size === void 0 ? 0 : _ref$size;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
      if (body == null) {
        body = null;
      } else if (isURLSearchParams(body)) {
        body = Buffer.from(body.toString());
      } else if (isBlob2(body))
        ;
      else if (Buffer.isBuffer(body))
        ;
      else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        body = Buffer.from(body);
      } else if (ArrayBuffer.isView(body)) {
        body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
      } else if (body instanceof Stream2)
        ;
      else {
        body = Buffer.from(String(body));
      }
      this[INTERNALS2] = {
        body,
        disturbed: false,
        error: null
      };
      this.size = size;
      this.timeout = timeout;
      if (body instanceof Stream2) {
        body.on("error", function(err) {
          const error2 = err.name === "AbortError" ? err : new FetchError2(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
          _this[INTERNALS2].error = error2;
        });
      }
    }
    Body2.prototype = {
      get body() {
        return this[INTERNALS2].body;
      },
      get bodyUsed() {
        return this[INTERNALS2].disturbed;
      },
      arrayBuffer() {
        return consumeBody2.call(this).then(function(buf) {
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        });
      },
      blob() {
        let ct = this.headers && this.headers.get("content-type") || "";
        return consumeBody2.call(this).then(function(buf) {
          return Object.assign(new Blob3([], {
            type: ct.toLowerCase()
          }), {
            [BUFFER]: buf
          });
        });
      },
      json() {
        var _this2 = this;
        return consumeBody2.call(this).then(function(buffer) {
          try {
            return JSON.parse(buffer.toString());
          } catch (err) {
            return Body2.Promise.reject(new FetchError2(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
          }
        });
      },
      text() {
        return consumeBody2.call(this).then(function(buffer) {
          return buffer.toString();
        });
      },
      buffer() {
        return consumeBody2.call(this);
      },
      textConverted() {
        var _this3 = this;
        return consumeBody2.call(this).then(function(buffer) {
          return convertBody(buffer, _this3.headers);
        });
      }
    };
    Object.defineProperties(Body2.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    Body2.mixIn = function(proto) {
      for (const name of Object.getOwnPropertyNames(Body2.prototype)) {
        if (!(name in proto)) {
          const desc = Object.getOwnPropertyDescriptor(Body2.prototype, name);
          Object.defineProperty(proto, name, desc);
        }
      }
    };
    function consumeBody2() {
      var _this4 = this;
      if (this[INTERNALS2].disturbed) {
        return Body2.Promise.reject(new TypeError(`body used already for: ${this.url}`));
      }
      this[INTERNALS2].disturbed = true;
      if (this[INTERNALS2].error) {
        return Body2.Promise.reject(this[INTERNALS2].error);
      }
      let body = this.body;
      if (body === null) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      if (isBlob2(body)) {
        body = body.stream();
      }
      if (Buffer.isBuffer(body)) {
        return Body2.Promise.resolve(body);
      }
      if (!(body instanceof Stream2)) {
        return Body2.Promise.resolve(Buffer.alloc(0));
      }
      let accum = [];
      let accumBytes = 0;
      let abort = false;
      return new Body2.Promise(function(resolve2, reject) {
        let resTimeout;
        if (_this4.timeout) {
          resTimeout = setTimeout(function() {
            abort = true;
            reject(new FetchError2(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
          }, _this4.timeout);
        }
        body.on("error", function(err) {
          if (err.name === "AbortError") {
            abort = true;
            reject(err);
          } else {
            reject(new FetchError2(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
          }
        });
        body.on("data", function(chunk) {
          if (abort || chunk === null) {
            return;
          }
          if (_this4.size && accumBytes + chunk.length > _this4.size) {
            abort = true;
            reject(new FetchError2(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
            return;
          }
          accumBytes += chunk.length;
          accum.push(chunk);
        });
        body.on("end", function() {
          if (abort) {
            return;
          }
          clearTimeout(resTimeout);
          try {
            resolve2(Buffer.concat(accum, accumBytes));
          } catch (err) {
            reject(new FetchError2(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
          }
        });
      });
    }
    function convertBody(buffer, headers) {
      if (typeof convert !== "function") {
        throw new Error("The package `encoding` must be installed to use the textConverted() function");
      }
      const ct = headers.get("content-type");
      let charset = "utf-8";
      let res, str;
      if (ct) {
        res = /charset=([^;]*)/i.exec(ct);
      }
      str = buffer.slice(0, 1024).toString();
      if (!res && str) {
        res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
      }
      if (!res && str) {
        res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
        if (!res) {
          res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
          if (res) {
            res.pop();
          }
        }
        if (res) {
          res = /charset=(.*)/i.exec(res.pop());
        }
      }
      if (!res && str) {
        res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
      }
      if (res) {
        charset = res.pop();
        if (charset === "gb2312" || charset === "gbk") {
          charset = "gb18030";
        }
      }
      return convert(buffer, "UTF-8", charset).toString();
    }
    function isURLSearchParams(obj) {
      if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") {
        return false;
      }
      return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
    }
    function isBlob2(obj) {
      return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }
    function clone2(instance) {
      let p1, p2;
      let body = instance.body;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof Stream2 && typeof body.getBoundary !== "function") {
        p1 = new PassThrough2();
        p2 = new PassThrough2();
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS2].body = p1;
        body = p2;
      }
      return body;
    }
    function extractContentType2(body) {
      if (body === null) {
        return null;
      } else if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      } else if (isURLSearchParams(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      } else if (isBlob2(body)) {
        return body.type || null;
      } else if (Buffer.isBuffer(body)) {
        return null;
      } else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") {
        return null;
      } else if (ArrayBuffer.isView(body)) {
        return null;
      } else if (typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      } else if (body instanceof Stream2) {
        return null;
      } else {
        return "text/plain;charset=UTF-8";
      }
    }
    function getTotalBytes2(instance) {
      const body = instance.body;
      if (body === null) {
        return 0;
      } else if (isBlob2(body)) {
        return body.size;
      } else if (Buffer.isBuffer(body)) {
        return body.length;
      } else if (body && typeof body.getLengthSync === "function") {
        if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || body.hasKnownLength && body.hasKnownLength()) {
          return body.getLengthSync();
        }
        return null;
      } else {
        return null;
      }
    }
    function writeToStream2(dest, instance) {
      const body = instance.body;
      if (body === null) {
        dest.end();
      } else if (isBlob2(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    }
    Body2.Promise = global.Promise;
    var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
    function validateName(name) {
      name = `${name}`;
      if (invalidTokenRegex.test(name) || name === "") {
        throw new TypeError(`${name} is not a legal HTTP header name`);
      }
    }
    function validateValue(value) {
      value = `${value}`;
      if (invalidHeaderCharRegex.test(value)) {
        throw new TypeError(`${value} is not a legal HTTP header value`);
      }
    }
    function find(map, name) {
      name = name.toLowerCase();
      for (const key in map) {
        if (key.toLowerCase() === name) {
          return key;
        }
      }
      return void 0;
    }
    var MAP = Symbol("map");
    var Headers2 = class {
      constructor() {
        let init2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
        this[MAP] = Object.create(null);
        if (init2 instanceof Headers2) {
          const rawHeaders = init2.raw();
          const headerNames = Object.keys(rawHeaders);
          for (const headerName of headerNames) {
            for (const value of rawHeaders[headerName]) {
              this.append(headerName, value);
            }
          }
          return;
        }
        if (init2 == null)
          ;
        else if (typeof init2 === "object") {
          const method = init2[Symbol.iterator];
          if (method != null) {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            const pairs = [];
            for (const pair of init2) {
              if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") {
                throw new TypeError("Each header pair must be iterable");
              }
              pairs.push(Array.from(pair));
            }
            for (const pair of pairs) {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              this.append(pair[0], pair[1]);
            }
          } else {
            for (const key of Object.keys(init2)) {
              const value = init2[key];
              this.append(key, value);
            }
          }
        } else {
          throw new TypeError("Provided initializer must be an object");
        }
      }
      get(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key === void 0) {
          return null;
        }
        return this[MAP][key].join(", ");
      }
      forEach(callback) {
        let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
        let pairs = getHeaders(this);
        let i = 0;
        while (i < pairs.length) {
          var _pairs$i = pairs[i];
          const name = _pairs$i[0], value = _pairs$i[1];
          callback.call(thisArg, value, name, this);
          pairs = getHeaders(this);
          i++;
        }
      }
      set(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        this[MAP][key !== void 0 ? key : name] = [value];
      }
      append(name, value) {
        name = `${name}`;
        value = `${value}`;
        validateName(name);
        validateValue(value);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          this[MAP][key].push(value);
        } else {
          this[MAP][name] = [value];
        }
      }
      has(name) {
        name = `${name}`;
        validateName(name);
        return find(this[MAP], name) !== void 0;
      }
      delete(name) {
        name = `${name}`;
        validateName(name);
        const key = find(this[MAP], name);
        if (key !== void 0) {
          delete this[MAP][key];
        }
      }
      raw() {
        return this[MAP];
      }
      keys() {
        return createHeadersIterator(this, "key");
      }
      values() {
        return createHeadersIterator(this, "value");
      }
      [Symbol.iterator]() {
        return createHeadersIterator(this, "key+value");
      }
    };
    Headers2.prototype.entries = Headers2.prototype[Symbol.iterator];
    Object.defineProperty(Headers2.prototype, Symbol.toStringTag, {
      value: "Headers",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Headers2.prototype, {
      get: { enumerable: true },
      forEach: { enumerable: true },
      set: { enumerable: true },
      append: { enumerable: true },
      has: { enumerable: true },
      delete: { enumerable: true },
      keys: { enumerable: true },
      values: { enumerable: true },
      entries: { enumerable: true }
    });
    function getHeaders(headers) {
      let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
      const keys = Object.keys(headers[MAP]).sort();
      return keys.map(kind === "key" ? function(k) {
        return k.toLowerCase();
      } : kind === "value" ? function(k) {
        return headers[MAP][k].join(", ");
      } : function(k) {
        return [k.toLowerCase(), headers[MAP][k].join(", ")];
      });
    }
    var INTERNAL = Symbol("internal");
    function createHeadersIterator(target, kind) {
      const iterator = Object.create(HeadersIteratorPrototype);
      iterator[INTERNAL] = {
        target,
        kind,
        index: 0
      };
      return iterator;
    }
    var HeadersIteratorPrototype = Object.setPrototypeOf({
      next() {
        if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
          throw new TypeError("Value of `this` is not a HeadersIterator");
        }
        var _INTERNAL = this[INTERNAL];
        const target = _INTERNAL.target, kind = _INTERNAL.kind, index2 = _INTERNAL.index;
        const values = getHeaders(target, kind);
        const len = values.length;
        if (index2 >= len) {
          return {
            value: void 0,
            done: true
          };
        }
        this[INTERNAL].index = index2 + 1;
        return {
          value: values[index2],
          done: false
        };
      }
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
      value: "HeadersIterator",
      writable: false,
      enumerable: false,
      configurable: true
    });
    function exportNodeCompatibleHeaders(headers) {
      const obj = Object.assign({ __proto__: null }, headers[MAP]);
      const hostHeaderKey = find(headers[MAP], "Host");
      if (hostHeaderKey !== void 0) {
        obj[hostHeaderKey] = obj[hostHeaderKey][0];
      }
      return obj;
    }
    function createHeadersLenient(obj) {
      const headers = new Headers2();
      for (const name of Object.keys(obj)) {
        if (invalidTokenRegex.test(name)) {
          continue;
        }
        if (Array.isArray(obj[name])) {
          for (const val of obj[name]) {
            if (invalidHeaderCharRegex.test(val)) {
              continue;
            }
            if (headers[MAP][name] === void 0) {
              headers[MAP][name] = [val];
            } else {
              headers[MAP][name].push(val);
            }
          }
        } else if (!invalidHeaderCharRegex.test(obj[name])) {
          headers[MAP][name] = [obj[name]];
        }
      }
      return headers;
    }
    var INTERNALS$12 = Symbol("Response internals");
    var STATUS_CODES = http2.STATUS_CODES;
    var Response2 = class {
      constructor() {
        let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
        let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        Body2.call(this, body, opts);
        const status = opts.status || 200;
        const headers = new Headers2(opts.headers);
        if (body != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$12] = {
          url: opts.url,
          status,
          statusText: opts.statusText || STATUS_CODES[status],
          headers,
          counter: opts.counter
        };
      }
      get url() {
        return this[INTERNALS$12].url || "";
      }
      get status() {
        return this[INTERNALS$12].status;
      }
      get ok() {
        return this[INTERNALS$12].status >= 200 && this[INTERNALS$12].status < 300;
      }
      get redirected() {
        return this[INTERNALS$12].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$12].statusText;
      }
      get headers() {
        return this[INTERNALS$12].headers;
      }
      clone() {
        return new Response2(clone2(this), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected
        });
      }
    };
    Body2.mixIn(Response2.prototype);
    Object.defineProperties(Response2.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    Object.defineProperty(Response2.prototype, Symbol.toStringTag, {
      value: "Response",
      writable: false,
      enumerable: false,
      configurable: true
    });
    var INTERNALS$22 = Symbol("Request internals");
    var parse_url = Url.parse;
    var format_url = Url.format;
    var streamDestructionSupported = "destroy" in Stream2.Readable.prototype;
    function isRequest2(input) {
      return typeof input === "object" && typeof input[INTERNALS$22] === "object";
    }
    function isAbortSignal2(signal) {
      const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
      return !!(proto && proto.constructor.name === "AbortSignal");
    }
    var Request2 = class {
      constructor(input) {
        let init2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let parsedURL;
        if (!isRequest2(input)) {
          if (input && input.href) {
            parsedURL = parse_url(input.href);
          } else {
            parsedURL = parse_url(`${input}`);
          }
          input = {};
        } else {
          parsedURL = parse_url(input.url);
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest2(input) && input.body !== null) && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        let inputBody = init2.body != null ? init2.body : isRequest2(input) && input.body !== null ? clone2(input) : null;
        Body2.call(this, inputBody, {
          timeout: init2.timeout || input.timeout || 0,
          size: init2.size || input.size || 0
        });
        const headers = new Headers2(init2.headers || input.headers || {});
        if (inputBody != null && !headers.has("Content-Type")) {
          const contentType = extractContentType2(inputBody);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest2(input) ? input.signal : null;
        if ("signal" in init2)
          signal = init2.signal;
        if (signal != null && !isAbortSignal2(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS$22] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow !== void 0 ? init2.follow : input.follow !== void 0 ? input.follow : 20;
        this.compress = init2.compress !== void 0 ? init2.compress : input.compress !== void 0 ? input.compress : true;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
      }
      get method() {
        return this[INTERNALS$22].method;
      }
      get url() {
        return format_url(this[INTERNALS$22].parsedURL);
      }
      get headers() {
        return this[INTERNALS$22].headers;
      }
      get redirect() {
        return this[INTERNALS$22].redirect;
      }
      get signal() {
        return this[INTERNALS$22].signal;
      }
      clone() {
        return new Request2(this);
      }
    };
    Body2.mixIn(Request2.prototype);
    Object.defineProperty(Request2.prototype, Symbol.toStringTag, {
      value: "Request",
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperties(Request2.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    function getNodeRequestOptions2(request) {
      const parsedURL = request[INTERNALS$22].parsedURL;
      const headers = new Headers2(request[INTERNALS$22].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      if (!parsedURL.protocol || !parsedURL.hostname) {
        throw new TypeError("Only absolute URLs are supported");
      }
      if (!/^https?:$/.test(parsedURL.protocol)) {
        throw new TypeError("Only HTTP(S) protocols are supported");
      }
      if (request.signal && request.body instanceof Stream2.Readable && !streamDestructionSupported) {
        throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
      }
      let contentLengthValue = null;
      if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body != null) {
        const totalBytes = getTotalBytes2(request);
        if (typeof totalBytes === "number") {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate");
      }
      let agent = request.agent;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      return Object.assign({}, parsedURL, {
        method: request.method,
        headers: exportNodeCompatibleHeaders(headers),
        agent
      });
    }
    function AbortError2(message) {
      Error.call(this, message);
      this.type = "aborted";
      this.message = message;
      Error.captureStackTrace(this, this.constructor);
    }
    AbortError2.prototype = Object.create(Error.prototype);
    AbortError2.prototype.constructor = AbortError2;
    AbortError2.prototype.name = "AbortError";
    var PassThrough$1 = Stream2.PassThrough;
    var resolve_url = Url.resolve;
    function fetch2(url, opts) {
      if (!fetch2.Promise) {
        throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
      }
      Body2.Promise = fetch2.Promise;
      return new fetch2.Promise(function(resolve2, reject) {
        const request = new Request2(url, opts);
        const options2 = getNodeRequestOptions2(request);
        const send = (options2.protocol === "https:" ? https2 : http2).request;
        const signal = request.signal;
        let response = null;
        const abort = function abort2() {
          let error2 = new AbortError2("The user aborted a request.");
          reject(error2);
          if (request.body && request.body instanceof Stream2.Readable) {
            request.body.destroy(error2);
          }
          if (!response || !response.body)
            return;
          response.body.emit("error", error2);
        };
        if (signal && signal.aborted) {
          abort();
          return;
        }
        const abortAndFinalize = function abortAndFinalize2() {
          abort();
          finalize();
        };
        const req = send(options2);
        let reqTimeout;
        if (signal) {
          signal.addEventListener("abort", abortAndFinalize);
        }
        function finalize() {
          req.abort();
          if (signal)
            signal.removeEventListener("abort", abortAndFinalize);
          clearTimeout(reqTimeout);
        }
        if (request.timeout) {
          req.once("socket", function(socket) {
            reqTimeout = setTimeout(function() {
              reject(new FetchError2(`network timeout at: ${request.url}`, "request-timeout"));
              finalize();
            }, request.timeout);
          });
        }
        req.on("error", function(err) {
          reject(new FetchError2(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
          finalize();
        });
        req.on("response", function(res) {
          clearTimeout(reqTimeout);
          const headers = createHeadersLenient(res.headers);
          if (fetch2.isRedirect(res.statusCode)) {
            const location = headers.get("Location");
            const locationURL = location === null ? null : resolve_url(request.url, location);
            switch (request.redirect) {
              case "error":
                reject(new FetchError2(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
                finalize();
                return;
              case "manual":
                if (locationURL !== null) {
                  try {
                    headers.set("Location", locationURL);
                  } catch (err) {
                    reject(err);
                  }
                }
                break;
              case "follow":
                if (locationURL === null) {
                  break;
                }
                if (request.counter >= request.follow) {
                  reject(new FetchError2(`maximum redirect reached at: ${request.url}`, "max-redirect"));
                  finalize();
                  return;
                }
                const requestOpts = {
                  headers: new Headers2(request.headers),
                  follow: request.follow,
                  counter: request.counter + 1,
                  agent: request.agent,
                  compress: request.compress,
                  method: request.method,
                  body: request.body,
                  signal: request.signal,
                  timeout: request.timeout,
                  size: request.size
                };
                if (res.statusCode !== 303 && request.body && getTotalBytes2(request) === null) {
                  reject(new FetchError2("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
                  finalize();
                  return;
                }
                if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === "POST") {
                  requestOpts.method = "GET";
                  requestOpts.body = void 0;
                  requestOpts.headers.delete("content-length");
                }
                resolve2(fetch2(new Request2(locationURL, requestOpts)));
                finalize();
                return;
            }
          }
          res.once("end", function() {
            if (signal)
              signal.removeEventListener("abort", abortAndFinalize);
          });
          let body = res.pipe(new PassThrough$1());
          const response_options = {
            url: request.url,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers,
            size: request.size,
            timeout: request.timeout,
            counter: request.counter
          };
          const codings = headers.get("Content-Encoding");
          if (!request.compress || request.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          const zlibOptions = {
            flush: zlib2.Z_SYNC_FLUSH,
            finishFlush: zlib2.Z_SYNC_FLUSH
          };
          if (codings == "gzip" || codings == "x-gzip") {
            body = body.pipe(zlib2.createGunzip(zlibOptions));
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          if (codings == "deflate" || codings == "x-deflate") {
            const raw = res.pipe(new PassThrough$1());
            raw.once("data", function(chunk) {
              if ((chunk[0] & 15) === 8) {
                body = body.pipe(zlib2.createInflate());
              } else {
                body = body.pipe(zlib2.createInflateRaw());
              }
              response = new Response2(body, response_options);
              resolve2(response);
            });
            return;
          }
          if (codings == "br" && typeof zlib2.createBrotliDecompress === "function") {
            body = body.pipe(zlib2.createBrotliDecompress());
            response = new Response2(body, response_options);
            resolve2(response);
            return;
          }
          response = new Response2(body, response_options);
          resolve2(response);
        });
        writeToStream2(req, request);
      });
    }
    fetch2.isRedirect = function(code) {
      return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };
    fetch2.Promise = global.Promise;
    module2.exports = exports = fetch2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = exports;
    exports.Headers = Headers2;
    exports.Request = Request2;
    exports.Response = Response2;
    exports.FetchError = FetchError2;
  }
});

// node_modules/cross-fetch/dist/node-ponyfill.js
var require_node_ponyfill = __commonJS({
  "node_modules/cross-fetch/dist/node-ponyfill.js"(exports, module2) {
    init_shims();
    var nodeFetch = require_lib();
    var realFetch = nodeFetch.default || nodeFetch;
    var fetch2 = function(url, options2) {
      if (/^\/\//.test(url)) {
        url = "https:" + url;
      }
      return realFetch.call(this, url, options2);
    };
    fetch2.ponyfill = true;
    module2.exports = exports = fetch2;
    exports.fetch = fetch2;
    exports.Headers = nodeFetch.Headers;
    exports.Request = nodeFetch.Request;
    exports.Response = nodeFetch.Response;
    exports.default = fetch2;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/fetch.js
var require_fetch = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/fetch.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remove = exports.put = exports.post = exports.get = void 0;
    var cross_fetch_1 = __importDefault(require_node_ponyfill());
    var _getErrorMessage = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
    var handleError = (error2, reject) => {
      if (typeof error2.json !== "function") {
        return reject(error2);
      }
      error2.json().then((err) => {
        return reject({
          message: _getErrorMessage(err),
          status: (error2 === null || error2 === void 0 ? void 0 : error2.status) || 500
        });
      });
    };
    var _getRequestParams = (method, options2, body) => {
      const params = { method, headers: (options2 === null || options2 === void 0 ? void 0 : options2.headers) || {} };
      if (method === "GET") {
        return params;
      }
      params.headers = Object.assign({ "Content-Type": "text/plain;charset=UTF-8" }, options2 === null || options2 === void 0 ? void 0 : options2.headers);
      params.body = JSON.stringify(body);
      return params;
    };
    function _handleRequest(method, url, options2, body) {
      return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve2, reject) => {
          cross_fetch_1.default(url, _getRequestParams(method, options2, body)).then((result) => {
            if (!result.ok)
              throw result;
            if (options2 === null || options2 === void 0 ? void 0 : options2.noResolveJson)
              return resolve2;
            return result.json();
          }).then((data) => resolve2(data)).catch((error2) => handleError(error2, reject));
        });
      });
    }
    function get(url, options2) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("GET", url, options2);
      });
    }
    exports.get = get;
    function post(url, body, options2) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("POST", url, options2, body);
      });
    }
    exports.post = post;
    function put(url, body, options2) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("PUT", url, options2, body);
      });
    }
    exports.put = put;
    function remove(url, body, options2) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("DELETE", url, options2, body);
      });
    }
    exports.remove = remove;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/version.js
var require_version2 = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/version.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "1.18.0";
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/constants.js
var require_constants2 = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COOKIE_OPTIONS = exports.STORAGE_KEY = exports.EXPIRY_MARGIN = exports.DEFAULT_HEADERS = exports.AUDIENCE = exports.GOTRUE_URL = void 0;
    var version_1 = require_version2();
    exports.GOTRUE_URL = "http://localhost:9999";
    exports.AUDIENCE = "";
    exports.DEFAULT_HEADERS = { "X-Client-Info": `gotrue-js/${version_1.version}` };
    exports.EXPIRY_MARGIN = 60 * 1e3;
    exports.STORAGE_KEY = "supabase.auth.token";
    exports.COOKIE_OPTIONS = {
      name: "sb:token",
      lifetime: 60 * 60 * 8,
      domain: "",
      path: "/",
      sameSite: "lax"
    };
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/cookies.js
var require_cookies = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/cookies.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteCookie = exports.setCookie = exports.setCookies = void 0;
    function serialize(name, val, options2) {
      const opt = options2 || {};
      const enc = encodeURIComponent;
      const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      const value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      let str = name + "=" + value;
      if (opt.maxAge != null) {
        const maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== "function") {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + opt.expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.sameSite) {
        const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function isSecureEnvironment(req) {
      if (!req || !req.headers || !req.headers.host) {
        throw new Error('The "host" request header is not available');
      }
      const host = req.headers.host.indexOf(":") > -1 && req.headers.host.split(":")[0] || req.headers.host;
      if (["localhost", "127.0.0.1"].indexOf(host) > -1 || host.endsWith(".local")) {
        return false;
      }
      return true;
    }
    function serializeCookie(cookie, secure) {
      var _a, _b, _c;
      return serialize(cookie.name, cookie.value, {
        maxAge: cookie.maxAge,
        expires: new Date(Date.now() + cookie.maxAge * 1e3),
        httpOnly: true,
        secure,
        path: (_a = cookie.path) !== null && _a !== void 0 ? _a : "/",
        domain: (_b = cookie.domain) !== null && _b !== void 0 ? _b : "",
        sameSite: (_c = cookie.sameSite) !== null && _c !== void 0 ? _c : "lax"
      });
    }
    function setCookies(req, res, cookies) {
      const strCookies = cookies.map((c) => serializeCookie(c, isSecureEnvironment(req)));
      const previousCookies = res.getHeader("Set-Cookie");
      if (previousCookies) {
        if (previousCookies instanceof Array) {
          Array.prototype.push.apply(strCookies, previousCookies);
        } else if (typeof previousCookies === "string") {
          strCookies.push(previousCookies);
        }
      }
      res.setHeader("Set-Cookie", strCookies);
    }
    exports.setCookies = setCookies;
    function setCookie(req, res, cookie) {
      setCookies(req, res, [cookie]);
    }
    exports.setCookie = setCookie;
    function deleteCookie(req, res, name) {
      setCookie(req, res, {
        name,
        value: "",
        maxAge: -1
      });
    }
    exports.deleteCookie = deleteCookie;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/helpers.js
var require_helpers = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/helpers.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParameterByName = exports.isBrowser = exports.uuid = exports.expiresAt = void 0;
    function expiresAt(expiresIn) {
      const timeNow = Math.round(Date.now() / 1e3);
      return timeNow + expiresIn;
    }
    exports.expiresAt = expiresAt;
    function uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    }
    exports.uuid = uuid;
    exports.isBrowser = () => typeof window !== "undefined";
    function getParameterByName(name, url) {
      if (!url)
        url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&#]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
      if (!results)
        return null;
      if (!results[2])
        return "";
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    exports.getParameterByName = getParameterByName;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/GoTrueApi.js
var require_GoTrueApi = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/GoTrueApi.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var fetch_1 = require_fetch();
    var constants_1 = require_constants2();
    var cookies_1 = require_cookies();
    var helpers_1 = require_helpers();
    var GoTrueApi = class {
      constructor({ url = "", headers = {}, cookieOptions }) {
        this.url = url;
        this.headers = headers;
        this.cookieOptions = Object.assign(Object.assign({}, constants_1.COOKIE_OPTIONS), cookieOptions);
      }
      signUpWithEmail(email, password, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "";
            if (options2.redirectTo) {
              queryString = "?redirect_to=" + encodeURIComponent(options2.redirectTo);
            }
            const data = yield fetch_1.post(`${this.url}/signup${queryString}`, { email, password, data: options2.data }, { headers });
            let session = Object.assign({}, data);
            if (session.expires_in)
              session.expires_at = helpers_1.expiresAt(data.expires_in);
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      signInWithEmail(email, password, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "?grant_type=password";
            if (options2.redirectTo) {
              queryString += "&redirect_to=" + encodeURIComponent(options2.redirectTo);
            }
            const data = yield fetch_1.post(`${this.url}/token${queryString}`, { email, password }, { headers });
            let session = Object.assign({}, data);
            if (session.expires_in)
              session.expires_at = helpers_1.expiresAt(data.expires_in);
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      signUpWithPhone(phone, password, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            const data = yield fetch_1.post(`${this.url}/signup`, { phone, password, data: options2.data }, { headers });
            let session = Object.assign({}, data);
            if (session.expires_in)
              session.expires_at = helpers_1.expiresAt(data.expires_in);
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      signInWithPhone(phone, password) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "?grant_type=password";
            const data = yield fetch_1.post(`${this.url}/token${queryString}`, { phone, password }, { headers });
            let session = Object.assign({}, data);
            if (session.expires_in)
              session.expires_at = helpers_1.expiresAt(data.expires_in);
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      sendMagicLinkEmail(email, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "";
            if (options2.redirectTo) {
              queryString += "?redirect_to=" + encodeURIComponent(options2.redirectTo);
            }
            const data = yield fetch_1.post(`${this.url}/magiclink${queryString}`, { email }, { headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      sendMobileOTP(phone) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            const data = yield fetch_1.post(`${this.url}/otp`, { phone }, { headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      verifyMobileOTP(phone, token, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            const data = yield fetch_1.post(`${this.url}/verify`, { phone, token, type: "sms", redirect_to: options2.redirectTo }, { headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      inviteUserByEmail(email, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "";
            if (options2.redirectTo) {
              queryString += "?redirect_to=" + encodeURIComponent(options2.redirectTo);
            }
            const data = yield fetch_1.post(`${this.url}/invite${queryString}`, { email, data: options2.data }, { headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      resetPasswordForEmail(email, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let headers = Object.assign({}, this.headers);
            let queryString = "";
            if (options2.redirectTo) {
              queryString += "?redirect_to=" + encodeURIComponent(options2.redirectTo);
            }
            const data = yield fetch_1.post(`${this.url}/recover${queryString}`, { email }, { headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      _createRequestHeaders(jwt) {
        const headers = Object.assign({}, this.headers);
        headers["Authorization"] = `Bearer ${jwt}`;
        return headers;
      }
      signOut(jwt) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            yield fetch_1.post(`${this.url}/logout`, {}, { headers: this._createRequestHeaders(jwt), noResolveJson: true });
            return { error: null };
          } catch (error2) {
            return { error: error2 };
          }
        });
      }
      getUrlForProvider(provider, options2) {
        let urlParams = [`provider=${encodeURIComponent(provider)}`];
        if (options2 === null || options2 === void 0 ? void 0 : options2.redirectTo) {
          urlParams.push(`redirect_to=${encodeURIComponent(options2.redirectTo)}`);
        }
        if (options2 === null || options2 === void 0 ? void 0 : options2.scopes) {
          urlParams.push(`scopes=${encodeURIComponent(options2.scopes)}`);
        }
        return `${this.url}/authorize?${urlParams.join("&")}`;
      }
      getUser(jwt) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.get(`${this.url}/user`, { headers: this._createRequestHeaders(jwt) });
            return { user: data, data, error: null };
          } catch (error2) {
            return { user: null, data: null, error: error2 };
          }
        });
      }
      updateUser(jwt, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.put(`${this.url}/user`, attributes, {
              headers: this._createRequestHeaders(jwt)
            });
            return { user: data, data, error: null };
          } catch (error2) {
            return { user: null, data: null, error: error2 };
          }
        });
      }
      deleteUser(uid, jwt) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.remove(`${this.url}/admin/users/${uid}`, {}, {
              headers: this._createRequestHeaders(jwt)
            });
            return { user: data, data, error: null };
          } catch (error2) {
            return { user: null, data: null, error: error2 };
          }
        });
      }
      refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.post(`${this.url}/token?grant_type=refresh_token`, { refresh_token: refreshToken }, { headers: this.headers });
            let session = Object.assign({}, data);
            if (session.expires_in)
              session.expires_at = helpers_1.expiresAt(data.expires_in);
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      setAuthCookie(req, res) {
        if (req.method !== "POST") {
          res.setHeader("Allow", "POST");
          res.status(405).end("Method Not Allowed");
        }
        const { event, session } = req.body;
        if (!event)
          throw new Error("Auth event missing!");
        if (event === "SIGNED_IN") {
          if (!session)
            throw new Error("Auth session missing!");
          cookies_1.setCookie(req, res, {
            name: this.cookieOptions.name,
            value: session.access_token,
            domain: this.cookieOptions.domain,
            maxAge: this.cookieOptions.lifetime,
            path: this.cookieOptions.path,
            sameSite: this.cookieOptions.sameSite
          });
        }
        if (event === "SIGNED_OUT")
          cookies_1.deleteCookie(req, res, this.cookieOptions.name);
        res.status(200).json({});
      }
      getUserByCookie(req) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!req.cookies)
              throw new Error("Not able to parse cookies! When using Express make sure the cookie-parser middleware is in use!");
            if (!req.cookies[this.cookieOptions.name])
              throw new Error("No cookie found!");
            const token = req.cookies[this.cookieOptions.name];
            const { user, error: error2 } = yield this.getUser(token);
            if (error2)
              throw error2;
            return { user, data: user, error: null };
          } catch (error2) {
            return { user: null, data: null, error: error2 };
          }
        });
      }
      generateLink(type, email, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.post(`${this.url}/admin/generate_link`, {
              type,
              email,
              password: options2.password,
              data: options2.data,
              redirect_to: options2.redirectTo
            }, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
    };
    exports.default = GoTrueApi;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/polyfills.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.polyfillGlobalThis = void 0;
    function polyfillGlobalThis() {
      if (typeof globalThis === "object")
        return;
      try {
        Object.defineProperty(Object.prototype, "__magic__", {
          get: function() {
            return this;
          },
          configurable: true
        });
        __magic__.globalThis = __magic__;
        delete Object.prototype.__magic__;
      } catch (e) {
        if (typeof self !== "undefined") {
          self.globalThis = self;
        }
      }
    }
    exports.polyfillGlobalThis = polyfillGlobalThis;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/GoTrueClient.js
var require_GoTrueClient = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/GoTrueClient.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var GoTrueApi_1 = __importDefault(require_GoTrueApi());
    var helpers_1 = require_helpers();
    var constants_1 = require_constants2();
    var polyfills_1 = require_polyfills();
    polyfills_1.polyfillGlobalThis();
    var DEFAULT_OPTIONS = {
      url: constants_1.GOTRUE_URL,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      headers: constants_1.DEFAULT_HEADERS
    };
    var GoTrueClient = class {
      constructor(options2) {
        this.stateChangeEmitters = new Map();
        const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options2);
        this.currentUser = null;
        this.currentSession = null;
        this.autoRefreshToken = settings.autoRefreshToken;
        this.persistSession = settings.persistSession;
        this.localStorage = settings.localStorage || globalThis.localStorage;
        this.api = new GoTrueApi_1.default({
          url: settings.url,
          headers: settings.headers,
          cookieOptions: settings.cookieOptions
        });
        this._recoverSession();
        this._recoverAndRefresh();
        try {
          if (settings.detectSessionInUrl && helpers_1.isBrowser() && !!helpers_1.getParameterByName("access_token")) {
            this.getSessionFromUrl({ storeSession: true });
          }
        } catch (error2) {
          console.log("Error getting session from URL.");
        }
      }
      signUp({ email, password, phone }, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            this._removeSession();
            const { data, error: error2 } = phone && password ? yield this.api.signUpWithPhone(phone, password, {
              data: options2.data
            }) : yield this.api.signUpWithEmail(email, password, {
              redirectTo: options2.redirectTo,
              data: options2.data
            });
            if (error2) {
              throw error2;
            }
            if (!data) {
              throw "An error occurred on sign up.";
            }
            let session = null;
            let user = null;
            if (data.access_token) {
              session = data;
              user = session.user;
              this._saveSession(session);
              this._notifyAllSubscribers("SIGNED_IN");
            }
            if (data.id) {
              user = data;
            }
            return { data, user, session, error: null };
          } catch (error2) {
            return { data: null, user: null, session: null, error: error2 };
          }
        });
      }
      signIn({ email, phone, password, refreshToken, provider }, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            this._removeSession();
            if (email && !password) {
              const { error: error2 } = yield this.api.sendMagicLinkEmail(email, {
                redirectTo: options2.redirectTo
              });
              return { data: null, user: null, session: null, error: error2 };
            }
            if (email && password) {
              return this._handleEmailSignIn(email, password, {
                redirectTo: options2.redirectTo
              });
            }
            if (phone && !password) {
              const { error: error2 } = yield this.api.sendMobileOTP(phone);
              return { data: null, user: null, session: null, error: error2 };
            }
            if (phone && password) {
              return this._handlePhoneSignIn(phone, password);
            }
            if (refreshToken) {
              const { error: error2 } = yield this._callRefreshToken(refreshToken);
              if (error2)
                throw error2;
              return {
                data: this.currentSession,
                user: this.currentUser,
                session: this.currentSession,
                error: null
              };
            }
            if (provider) {
              return this._handleProviderSignIn(provider, {
                redirectTo: options2.redirectTo,
                scopes: options2.scopes
              });
            }
            throw new Error(`You must provide either an email, phone number or a third-party provider.`);
          } catch (error2) {
            return { data: null, user: null, session: null, error: error2 };
          }
        });
      }
      verifyOTP({ phone, token }, options2 = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            this._removeSession();
            const { data, error: error2 } = yield this.api.verifyMobileOTP(phone, token, options2);
            if (error2) {
              throw error2;
            }
            if (!data) {
              throw "An error occurred on token verification.";
            }
            let session = null;
            let user = null;
            if (data.access_token) {
              session = data;
              user = session.user;
              this._saveSession(session);
              this._notifyAllSubscribers("SIGNED_IN");
            }
            if (data.id) {
              user = data;
            }
            return { data, user, session, error: null };
          } catch (error2) {
            return { data: null, user: null, session: null, error: error2 };
          }
        });
      }
      user() {
        return this.currentUser;
      }
      session() {
        return this.currentSession;
      }
      refreshSession() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!((_a = this.currentSession) === null || _a === void 0 ? void 0 : _a.access_token))
              throw new Error("Not logged in.");
            const { error: error2 } = yield this._callRefreshToken();
            if (error2)
              throw error2;
            return { data: this.currentSession, user: this.currentUser, error: null };
          } catch (error2) {
            return { data: null, user: null, error: error2 };
          }
        });
      }
      update(attributes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!((_a = this.currentSession) === null || _a === void 0 ? void 0 : _a.access_token))
              throw new Error("Not logged in.");
            const { user, error: error2 } = yield this.api.updateUser(this.currentSession.access_token, attributes);
            if (error2)
              throw error2;
            if (!user)
              throw Error("Invalid user data.");
            const session = Object.assign(Object.assign({}, this.currentSession), { user });
            this._saveSession(session);
            this._notifyAllSubscribers("USER_UPDATED");
            return { data: user, user, error: null };
          } catch (error2) {
            return { data: null, user: null, error: error2 };
          }
        });
      }
      setSession(refresh_token) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!refresh_token) {
              throw new Error("No current session.");
            }
            const { data, error: error2 } = yield this.api.refreshAccessToken(refresh_token);
            if (error2) {
              return { session: null, error: error2 };
            }
            if (!data) {
              return {
                session: null,
                error: { name: "Invalid refresh_token", message: "JWT token provided is Invalid" }
              };
            }
            this._saveSession(data);
            this._notifyAllSubscribers("SIGNED_IN");
            return { session: data, error: null };
          } catch (error2) {
            return { error: error2, session: null };
          }
        });
      }
      setAuth(access_token) {
        this.currentSession = Object.assign(Object.assign({}, this.currentSession), { access_token, token_type: "bearer", user: null });
        return this.currentSession;
      }
      getSessionFromUrl(options2) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!helpers_1.isBrowser())
              throw new Error("No browser detected.");
            const error_description = helpers_1.getParameterByName("error_description");
            if (error_description)
              throw new Error(error_description);
            const provider_token = helpers_1.getParameterByName("provider_token");
            const access_token = helpers_1.getParameterByName("access_token");
            if (!access_token)
              throw new Error("No access_token detected.");
            const expires_in = helpers_1.getParameterByName("expires_in");
            if (!expires_in)
              throw new Error("No expires_in detected.");
            const refresh_token = helpers_1.getParameterByName("refresh_token");
            if (!refresh_token)
              throw new Error("No refresh_token detected.");
            const token_type = helpers_1.getParameterByName("token_type");
            if (!token_type)
              throw new Error("No token_type detected.");
            const timeNow = Math.round(Date.now() / 1e3);
            const expires_at = timeNow + parseInt(expires_in);
            const { user, error: error2 } = yield this.api.getUser(access_token);
            if (error2)
              throw error2;
            const session = {
              provider_token,
              access_token,
              expires_in: parseInt(expires_in),
              expires_at,
              refresh_token,
              token_type,
              user
            };
            if (options2 === null || options2 === void 0 ? void 0 : options2.storeSession) {
              this._saveSession(session);
              this._notifyAllSubscribers("SIGNED_IN");
              if (helpers_1.getParameterByName("type") === "recovery") {
                this._notifyAllSubscribers("PASSWORD_RECOVERY");
              }
            }
            window.location.hash = "";
            return { data: session, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      signOut() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          const accessToken = (_a = this.currentSession) === null || _a === void 0 ? void 0 : _a.access_token;
          this._removeSession();
          this._notifyAllSubscribers("SIGNED_OUT");
          if (accessToken) {
            const { error: error2 } = yield this.api.signOut(accessToken);
            if (error2)
              return { error: error2 };
          }
          return { error: null };
        });
      }
      onAuthStateChange(callback) {
        try {
          const id = helpers_1.uuid();
          const self2 = this;
          const subscription = {
            id,
            callback,
            unsubscribe: () => {
              self2.stateChangeEmitters.delete(id);
            }
          };
          this.stateChangeEmitters.set(id, subscription);
          return { data: subscription, error: null };
        } catch (error2) {
          return { data: null, error: error2 };
        }
      }
      _handleEmailSignIn(email, password, options2 = {}) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const { data, error: error2 } = yield this.api.signInWithEmail(email, password, {
              redirectTo: options2.redirectTo
            });
            if (error2 || !data)
              return { data: null, user: null, session: null, error: error2 };
            if (((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.confirmed_at) || ((_b = data === null || data === void 0 ? void 0 : data.user) === null || _b === void 0 ? void 0 : _b.email_confirmed_at)) {
              this._saveSession(data);
              this._notifyAllSubscribers("SIGNED_IN");
            }
            return { data, user: data.user, session: data, error: null };
          } catch (error2) {
            return { data: null, user: null, session: null, error: error2 };
          }
        });
      }
      _handlePhoneSignIn(phone, password) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const { data, error: error2 } = yield this.api.signInWithPhone(phone, password);
            if (error2 || !data)
              return { data: null, user: null, session: null, error: error2 };
            if ((_a = data === null || data === void 0 ? void 0 : data.user) === null || _a === void 0 ? void 0 : _a.phone_confirmed_at) {
              this._saveSession(data);
              this._notifyAllSubscribers("SIGNED_IN");
            }
            return { data, user: data.user, session: data, error: null };
          } catch (error2) {
            return { data: null, user: null, session: null, error: error2 };
          }
        });
      }
      _handleProviderSignIn(provider, options2 = {}) {
        const url = this.api.getUrlForProvider(provider, {
          redirectTo: options2.redirectTo,
          scopes: options2.scopes
        });
        try {
          if (helpers_1.isBrowser()) {
            window.location.href = url;
          }
          return { provider, url, data: null, session: null, user: null, error: null };
        } catch (error2) {
          if (!!url)
            return { provider, url, data: null, session: null, user: null, error: null };
          return { data: null, user: null, session: null, error: error2 };
        }
      }
      _recoverSession() {
        var _a;
        try {
          const json = helpers_1.isBrowser() && ((_a = this.localStorage) === null || _a === void 0 ? void 0 : _a.getItem(constants_1.STORAGE_KEY));
          if (!json || typeof json !== "string") {
            return null;
          }
          const data = JSON.parse(json);
          const { currentSession, expiresAt } = data;
          const timeNow = Math.round(Date.now() / 1e3);
          if (expiresAt >= timeNow && (currentSession === null || currentSession === void 0 ? void 0 : currentSession.user)) {
            this._saveSession(currentSession);
            this._notifyAllSubscribers("SIGNED_IN");
          }
        } catch (error2) {
          console.log("error", error2);
        }
      }
      _recoverAndRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const json = helpers_1.isBrowser() && (yield this.localStorage.getItem(constants_1.STORAGE_KEY));
            if (!json) {
              return null;
            }
            const data = JSON.parse(json);
            const { currentSession, expiresAt } = data;
            const timeNow = Math.round(Date.now() / 1e3);
            if (expiresAt < timeNow) {
              if (this.autoRefreshToken && currentSession.refresh_token) {
                const { error: error2 } = yield this._callRefreshToken(currentSession.refresh_token);
                if (error2) {
                  console.log(error2.message);
                  yield this._removeSession();
                }
              } else {
                this._removeSession();
              }
            } else if (!currentSession || !currentSession.user) {
              console.log("Current session is missing data.");
              this._removeSession();
            } else {
              this._saveSession(currentSession);
              this._notifyAllSubscribers("SIGNED_IN");
            }
          } catch (err) {
            console.error(err);
            return null;
          }
        });
      }
      _callRefreshToken(refresh_token) {
        var _a;
        if (refresh_token === void 0) {
          refresh_token = (_a = this.currentSession) === null || _a === void 0 ? void 0 : _a.refresh_token;
        }
        return __awaiter(this, void 0, void 0, function* () {
          try {
            if (!refresh_token) {
              throw new Error("No current session.");
            }
            const { data, error: error2 } = yield this.api.refreshAccessToken(refresh_token);
            if (error2)
              throw error2;
            if (!data)
              throw Error("Invalid session data.");
            this._saveSession(data);
            this._notifyAllSubscribers("SIGNED_IN");
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      _notifyAllSubscribers(event) {
        this.stateChangeEmitters.forEach((x) => x.callback(event, this.currentSession));
      }
      _saveSession(session) {
        this.currentSession = session;
        this.currentUser = session.user;
        const expiresAt = session.expires_at;
        if (expiresAt) {
          const timeNow = Math.round(Date.now() / 1e3);
          const expiresIn = expiresAt - timeNow;
          const refreshDurationBeforeExpires = expiresIn > 60 ? 60 : 0.5;
          this._startAutoRefreshToken((expiresIn - refreshDurationBeforeExpires) * 1e3);
        }
        if (this.persistSession && session.expires_at) {
          this._persistSession(this.currentSession);
        }
      }
      _persistSession(currentSession) {
        const data = { currentSession, expiresAt: currentSession.expires_at };
        helpers_1.isBrowser() && this.localStorage.setItem(constants_1.STORAGE_KEY, JSON.stringify(data));
      }
      _removeSession() {
        return __awaiter(this, void 0, void 0, function* () {
          this.currentSession = null;
          this.currentUser = null;
          if (this.refreshTokenTimer)
            clearTimeout(this.refreshTokenTimer);
          helpers_1.isBrowser() && (yield this.localStorage.removeItem(constants_1.STORAGE_KEY));
        });
      }
      _startAutoRefreshToken(value) {
        if (this.refreshTokenTimer)
          clearTimeout(this.refreshTokenTimer);
        if (value <= 0 || !this.autoRefreshToken)
          return;
        this.refreshTokenTimer = setTimeout(() => this._callRefreshToken(), value);
        if (typeof this.refreshTokenTimer.unref === "function")
          this.refreshTokenTimer.unref();
      }
    };
    exports.default = GoTrueClient;
  }
});

// node_modules/@supabase/gotrue-js/dist/main/lib/types.js
var require_types = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/lib/types.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@supabase/gotrue-js/dist/main/index.js
var require_main = __commonJS({
  "node_modules/@supabase/gotrue-js/dist/main/index.js"(exports) {
    init_shims();
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GoTrueClient = exports.GoTrueApi = void 0;
    var GoTrueApi_1 = __importDefault(require_GoTrueApi());
    exports.GoTrueApi = GoTrueApi_1.default;
    var GoTrueClient_1 = __importDefault(require_GoTrueClient());
    exports.GoTrueClient = GoTrueClient_1.default;
    __exportStar(require_types(), exports);
  }
});

// node_modules/@supabase/supabase-js/dist/main/lib/SupabaseAuthClient.js
var require_SupabaseAuthClient = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/lib/SupabaseAuthClient.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseAuthClient = void 0;
    var gotrue_js_1 = require_main();
    var SupabaseAuthClient = class extends gotrue_js_1.GoTrueClient {
      constructor(options2) {
        super(options2);
      }
    };
    exports.SupabaseAuthClient = SupabaseAuthClient;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/types.js
var require_types2 = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/types.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostgrestBuilder = void 0;
    var cross_fetch_1 = __importDefault(require_node_ponyfill());
    var PostgrestBuilder = class {
      constructor(builder) {
        Object.assign(this, builder);
      }
      throwOnError() {
        this.shouldThrowOnError = true;
        return this;
      }
      then(onfulfilled, onrejected) {
        if (typeof this.schema === "undefined") {
        } else if (["GET", "HEAD"].includes(this.method)) {
          this.headers["Accept-Profile"] = this.schema;
        } else {
          this.headers["Content-Profile"] = this.schema;
        }
        if (this.method !== "GET" && this.method !== "HEAD") {
          this.headers["Content-Type"] = "application/json";
        }
        return cross_fetch_1.default(this.url.toString(), {
          method: this.method,
          headers: this.headers,
          body: JSON.stringify(this.body)
        }).then((res) => __awaiter(this, void 0, void 0, function* () {
          var _a, _b, _c;
          let error2 = null;
          let data = null;
          let count = null;
          if (res.ok) {
            const isReturnMinimal = (_a = this.headers["Prefer"]) === null || _a === void 0 ? void 0 : _a.split(",").includes("return=minimal");
            if (this.method !== "HEAD" && !isReturnMinimal) {
              const text = yield res.text();
              if (!text) {
              } else if (this.headers["Accept"] === "text/csv") {
                data = text;
              } else {
                data = JSON.parse(text);
              }
            }
            const countHeader = (_b = this.headers["Prefer"]) === null || _b === void 0 ? void 0 : _b.match(/count=(exact|planned|estimated)/);
            const contentRange = (_c = res.headers.get("content-range")) === null || _c === void 0 ? void 0 : _c.split("/");
            if (countHeader && contentRange && contentRange.length > 1) {
              count = parseInt(contentRange[1]);
            }
          } else {
            error2 = yield res.json();
            if (error2 && this.shouldThrowOnError) {
              throw error2;
            }
          }
          const postgrestResponse = {
            error: error2,
            data,
            count,
            status: res.status,
            statusText: res.statusText,
            body: data
          };
          return postgrestResponse;
        })).then(onfulfilled, onrejected);
      }
    };
    exports.PostgrestBuilder = PostgrestBuilder;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestTransformBuilder.js
var require_PostgrestTransformBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestTransformBuilder.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require_types2();
    var PostgrestTransformBuilder = class extends types_1.PostgrestBuilder {
      select(columns = "*") {
        let quoted = false;
        const cleanedColumns = columns.split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        return this;
      }
      order(column, { ascending = true, nullsFirst = false, foreignTable } = {}) {
        const key = typeof foreignTable === "undefined" ? "order" : `${foreignTable}.order`;
        const existingOrder = this.url.searchParams.get(key);
        this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}.${nullsFirst ? "nullsfirst" : "nullslast"}`);
        return this;
      }
      limit(count, { foreignTable } = {}) {
        const key = typeof foreignTable === "undefined" ? "limit" : `${foreignTable}.limit`;
        this.url.searchParams.set(key, `${count}`);
        return this;
      }
      range(from, to, { foreignTable } = {}) {
        const keyOffset = typeof foreignTable === "undefined" ? "offset" : `${foreignTable}.offset`;
        const keyLimit = typeof foreignTable === "undefined" ? "limit" : `${foreignTable}.limit`;
        this.url.searchParams.set(keyOffset, `${from}`);
        this.url.searchParams.set(keyLimit, `${to - from + 1}`);
        return this;
      }
      single() {
        this.headers["Accept"] = "application/vnd.pgrst.object+json";
        return this;
      }
      maybeSingle() {
        this.headers["Accept"] = "application/vnd.pgrst.object+json";
        const _this = new PostgrestTransformBuilder(this);
        _this.then = (onfulfilled, onrejected) => this.then((res) => {
          var _a, _b;
          if ((_b = (_a = res.error) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.includes("Results contain 0 rows")) {
            return onfulfilled({
              error: null,
              data: null,
              count: res.count,
              status: 200,
              statusText: "OK",
              body: null
            });
          }
          return onfulfilled(res);
        }, onrejected);
        return _this;
      }
      csv() {
        this.headers["Accept"] = "text/csv";
        return this;
      }
    };
    exports.default = PostgrestTransformBuilder;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestFilterBuilder.js
var require_PostgrestFilterBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestFilterBuilder.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestTransformBuilder_1 = __importDefault(require_PostgrestTransformBuilder());
    var PostgrestFilterBuilder = class extends PostgrestTransformBuilder_1.default {
      constructor() {
        super(...arguments);
        this.cs = this.contains;
        this.cd = this.containedBy;
        this.sl = this.rangeLt;
        this.sr = this.rangeGt;
        this.nxl = this.rangeGte;
        this.nxr = this.rangeLte;
        this.adj = this.rangeAdjacent;
        this.ov = this.overlaps;
      }
      not(column, operator, value) {
        this.url.searchParams.append(`${column}`, `not.${operator}.${value}`);
        return this;
      }
      or(filters, { foreignTable } = {}) {
        const key = typeof foreignTable === "undefined" ? "or" : `${foreignTable}.or`;
        this.url.searchParams.append(key, `(${filters})`);
        return this;
      }
      eq(column, value) {
        this.url.searchParams.append(`${column}`, `eq.${value}`);
        return this;
      }
      neq(column, value) {
        this.url.searchParams.append(`${column}`, `neq.${value}`);
        return this;
      }
      gt(column, value) {
        this.url.searchParams.append(`${column}`, `gt.${value}`);
        return this;
      }
      gte(column, value) {
        this.url.searchParams.append(`${column}`, `gte.${value}`);
        return this;
      }
      lt(column, value) {
        this.url.searchParams.append(`${column}`, `lt.${value}`);
        return this;
      }
      lte(column, value) {
        this.url.searchParams.append(`${column}`, `lte.${value}`);
        return this;
      }
      like(column, pattern) {
        this.url.searchParams.append(`${column}`, `like.${pattern}`);
        return this;
      }
      ilike(column, pattern) {
        this.url.searchParams.append(`${column}`, `ilike.${pattern}`);
        return this;
      }
      is(column, value) {
        this.url.searchParams.append(`${column}`, `is.${value}`);
        return this;
      }
      in(column, values) {
        const cleanedValues = values.map((s2) => {
          if (typeof s2 === "string" && new RegExp("[,()]").test(s2))
            return `"${s2}"`;
          else
            return `${s2}`;
        }).join(",");
        this.url.searchParams.append(`${column}`, `in.(${cleanedValues})`);
        return this;
      }
      contains(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(`${column}`, `cs.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(`${column}`, `cs.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(`${column}`, `cs.${JSON.stringify(value)}`);
        }
        return this;
      }
      containedBy(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(`${column}`, `cd.${value}`);
        } else if (Array.isArray(value)) {
          this.url.searchParams.append(`${column}`, `cd.{${value.join(",")}}`);
        } else {
          this.url.searchParams.append(`${column}`, `cd.${JSON.stringify(value)}`);
        }
        return this;
      }
      rangeLt(column, range) {
        this.url.searchParams.append(`${column}`, `sl.${range}`);
        return this;
      }
      rangeGt(column, range) {
        this.url.searchParams.append(`${column}`, `sr.${range}`);
        return this;
      }
      rangeGte(column, range) {
        this.url.searchParams.append(`${column}`, `nxl.${range}`);
        return this;
      }
      rangeLte(column, range) {
        this.url.searchParams.append(`${column}`, `nxr.${range}`);
        return this;
      }
      rangeAdjacent(column, range) {
        this.url.searchParams.append(`${column}`, `adj.${range}`);
        return this;
      }
      overlaps(column, value) {
        if (typeof value === "string") {
          this.url.searchParams.append(`${column}`, `ov.${value}`);
        } else {
          this.url.searchParams.append(`${column}`, `ov.{${value.join(",")}}`);
        }
        return this;
      }
      textSearch(column, query, { config, type = null } = {}) {
        let typePart = "";
        if (type === "plain") {
          typePart = "pl";
        } else if (type === "phrase") {
          typePart = "ph";
        } else if (type === "websearch") {
          typePart = "w";
        }
        const configPart = config === void 0 ? "" : `(${config})`;
        this.url.searchParams.append(`${column}`, `${typePart}fts${configPart}.${query}`);
        return this;
      }
      fts(column, query, { config } = {}) {
        const configPart = typeof config === "undefined" ? "" : `(${config})`;
        this.url.searchParams.append(`${column}`, `fts${configPart}.${query}`);
        return this;
      }
      plfts(column, query, { config } = {}) {
        const configPart = typeof config === "undefined" ? "" : `(${config})`;
        this.url.searchParams.append(`${column}`, `plfts${configPart}.${query}`);
        return this;
      }
      phfts(column, query, { config } = {}) {
        const configPart = typeof config === "undefined" ? "" : `(${config})`;
        this.url.searchParams.append(`${column}`, `phfts${configPart}.${query}`);
        return this;
      }
      wfts(column, query, { config } = {}) {
        const configPart = typeof config === "undefined" ? "" : `(${config})`;
        this.url.searchParams.append(`${column}`, `wfts${configPart}.${query}`);
        return this;
      }
      filter(column, operator, value) {
        this.url.searchParams.append(`${column}`, `${operator}.${value}`);
        return this;
      }
      match(query) {
        Object.keys(query).forEach((key) => {
          this.url.searchParams.append(`${key}`, `eq.${query[key]}`);
        });
        return this;
      }
    };
    exports.default = PostgrestFilterBuilder;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestQueryBuilder.js
var require_PostgrestQueryBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestQueryBuilder.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require_types2();
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var PostgrestQueryBuilder = class extends types_1.PostgrestBuilder {
      constructor(url, { headers = {}, schema } = {}) {
        super({});
        this.url = new URL(url);
        this.headers = Object.assign({}, headers);
        this.schema = schema;
      }
      select(columns = "*", { head = false, count = null } = {}) {
        this.method = "GET";
        let quoted = false;
        const cleanedColumns = columns.split("").map((c) => {
          if (/\s/.test(c) && !quoted) {
            return "";
          }
          if (c === '"') {
            quoted = !quoted;
          }
          return c;
        }).join("");
        this.url.searchParams.set("select", cleanedColumns);
        if (count) {
          this.headers["Prefer"] = `count=${count}`;
        }
        if (head) {
          this.method = "HEAD";
        }
        return new PostgrestFilterBuilder_1.default(this);
      }
      insert(values, { upsert = false, onConflict, returning = "representation", count = null } = {}) {
        this.method = "POST";
        const prefersHeaders = [`return=${returning}`];
        if (upsert)
          prefersHeaders.push("resolution=merge-duplicates");
        if (upsert && onConflict !== void 0)
          this.url.searchParams.set("on_conflict", onConflict);
        this.body = values;
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        if (Array.isArray(values)) {
          const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
          if (columns.length > 0) {
            const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
            this.url.searchParams.set("columns", uniqueColumns.join(","));
          }
        }
        return new PostgrestFilterBuilder_1.default(this);
      }
      upsert(values, { onConflict, returning = "representation", count = null, ignoreDuplicates = false } = {}) {
        this.method = "POST";
        const prefersHeaders = [
          `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`,
          `return=${returning}`
        ];
        if (onConflict !== void 0)
          this.url.searchParams.set("on_conflict", onConflict);
        this.body = values;
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        return new PostgrestFilterBuilder_1.default(this);
      }
      update(values, { returning = "representation", count = null } = {}) {
        this.method = "PATCH";
        const prefersHeaders = [`return=${returning}`];
        this.body = values;
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        return new PostgrestFilterBuilder_1.default(this);
      }
      delete({ returning = "representation", count = null } = {}) {
        this.method = "DELETE";
        const prefersHeaders = [`return=${returning}`];
        if (count) {
          prefersHeaders.push(`count=${count}`);
        }
        this.headers["Prefer"] = prefersHeaders.join(",");
        return new PostgrestFilterBuilder_1.default(this);
      }
    };
    exports.default = PostgrestQueryBuilder;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestRpcBuilder.js
var require_PostgrestRpcBuilder = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/PostgrestRpcBuilder.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var types_1 = require_types2();
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    var PostgrestRpcBuilder = class extends types_1.PostgrestBuilder {
      constructor(url, { headers = {}, schema } = {}) {
        super({});
        this.url = new URL(url);
        this.headers = Object.assign({}, headers);
        this.schema = schema;
      }
      rpc(params, { count = null } = {}) {
        this.method = "POST";
        this.body = params;
        if (count) {
          if (this.headers["Prefer"] !== void 0)
            this.headers["Prefer"] += `,count=${count}`;
          else
            this.headers["Prefer"] = `count=${count}`;
        }
        return new PostgrestFilterBuilder_1.default(this);
      }
    };
    exports.default = PostgrestRpcBuilder;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/version.js
var require_version3 = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/version.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "0.33.3";
  }
});

// node_modules/@supabase/postgrest-js/dist/main/lib/constants.js
var require_constants3 = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/lib/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_HEADERS = void 0;
    var version_1 = require_version3();
    exports.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${version_1.version}` };
  }
});

// node_modules/@supabase/postgrest-js/dist/main/PostgrestClient.js
var require_PostgrestClient = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/PostgrestClient.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    var PostgrestRpcBuilder_1 = __importDefault(require_PostgrestRpcBuilder());
    var constants_1 = require_constants3();
    var PostgrestClient = class {
      constructor(url, { headers = {}, schema } = {}) {
        this.url = url;
        this.headers = Object.assign(Object.assign({}, constants_1.DEFAULT_HEADERS), headers);
        this.schema = schema;
      }
      auth(token) {
        this.headers["Authorization"] = `Bearer ${token}`;
        return this;
      }
      from(table) {
        const url = `${this.url}/${table}`;
        return new PostgrestQueryBuilder_1.default(url, { headers: this.headers, schema: this.schema });
      }
      rpc(fn, params, { count = null } = {}) {
        const url = `${this.url}/rpc/${fn}`;
        return new PostgrestRpcBuilder_1.default(url, {
          headers: this.headers,
          schema: this.schema
        }).rpc(params, { count });
      }
    };
    exports.default = PostgrestClient;
  }
});

// node_modules/@supabase/postgrest-js/dist/main/index.js
var require_main2 = __commonJS({
  "node_modules/@supabase/postgrest-js/dist/main/index.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostgrestFilterBuilder = exports.PostgrestQueryBuilder = exports.PostgrestBuilder = exports.PostgrestClient = void 0;
    var PostgrestClient_1 = __importDefault(require_PostgrestClient());
    exports.PostgrestClient = PostgrestClient_1.default;
    var PostgrestFilterBuilder_1 = __importDefault(require_PostgrestFilterBuilder());
    exports.PostgrestFilterBuilder = PostgrestFilterBuilder_1.default;
    var PostgrestQueryBuilder_1 = __importDefault(require_PostgrestQueryBuilder());
    exports.PostgrestQueryBuilder = PostgrestQueryBuilder_1.default;
    var types_1 = require_types2();
    Object.defineProperty(exports, "PostgrestBuilder", { enumerable: true, get: function() {
      return types_1.PostgrestBuilder;
    } });
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/transformers.js
var require_transformers = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/transformers.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toTimestampString = exports.toArray = exports.toJson = exports.toIntRange = exports.toInt = exports.toFloat = exports.toDateRange = exports.toDate = exports.toBoolean = exports.convertCell = exports.convertColumn = exports.convertChangeData = exports.PostgresTypes = void 0;
    var PostgresTypes;
    (function(PostgresTypes2) {
      PostgresTypes2["abstime"] = "abstime";
      PostgresTypes2["bool"] = "bool";
      PostgresTypes2["date"] = "date";
      PostgresTypes2["daterange"] = "daterange";
      PostgresTypes2["float4"] = "float4";
      PostgresTypes2["float8"] = "float8";
      PostgresTypes2["int2"] = "int2";
      PostgresTypes2["int4"] = "int4";
      PostgresTypes2["int4range"] = "int4range";
      PostgresTypes2["int8"] = "int8";
      PostgresTypes2["int8range"] = "int8range";
      PostgresTypes2["json"] = "json";
      PostgresTypes2["jsonb"] = "jsonb";
      PostgresTypes2["money"] = "money";
      PostgresTypes2["numeric"] = "numeric";
      PostgresTypes2["oid"] = "oid";
      PostgresTypes2["reltime"] = "reltime";
      PostgresTypes2["time"] = "time";
      PostgresTypes2["timestamp"] = "timestamp";
      PostgresTypes2["timestamptz"] = "timestamptz";
      PostgresTypes2["timetz"] = "timetz";
      PostgresTypes2["tsrange"] = "tsrange";
      PostgresTypes2["tstzrange"] = "tstzrange";
    })(PostgresTypes = exports.PostgresTypes || (exports.PostgresTypes = {}));
    exports.convertChangeData = (columns, records, options2 = {}) => {
      let result = {};
      let skipTypes = typeof options2.skipTypes !== "undefined" ? options2.skipTypes : [];
      Object.entries(records).map(([key, value]) => {
        result[key] = exports.convertColumn(key, columns, records, skipTypes);
      });
      return result;
    };
    exports.convertColumn = (columnName, columns, records, skipTypes) => {
      let column = columns.find((x) => x.name == columnName);
      if (!column || skipTypes.includes(column.type)) {
        return noop2(records[columnName]);
      } else {
        return exports.convertCell(column.type, records[columnName]);
      }
    };
    exports.convertCell = (type, stringValue) => {
      try {
        if (stringValue === null)
          return null;
        if (type.charAt(0) === "_") {
          let arrayValue = type.slice(1, type.length);
          return exports.toArray(stringValue, arrayValue);
        }
        switch (type) {
          case PostgresTypes.abstime:
            return noop2(stringValue);
          case PostgresTypes.bool:
            return exports.toBoolean(stringValue);
          case PostgresTypes.date:
            return noop2(stringValue);
          case PostgresTypes.daterange:
            return exports.toDateRange(stringValue);
          case PostgresTypes.float4:
            return exports.toFloat(stringValue);
          case PostgresTypes.float8:
            return exports.toFloat(stringValue);
          case PostgresTypes.int2:
            return exports.toInt(stringValue);
          case PostgresTypes.int4:
            return exports.toInt(stringValue);
          case PostgresTypes.int4range:
            return exports.toIntRange(stringValue);
          case PostgresTypes.int8:
            return exports.toInt(stringValue);
          case PostgresTypes.int8range:
            return exports.toIntRange(stringValue);
          case PostgresTypes.json:
            return exports.toJson(stringValue);
          case PostgresTypes.jsonb:
            return exports.toJson(stringValue);
          case PostgresTypes.money:
            return exports.toFloat(stringValue);
          case PostgresTypes.numeric:
            return exports.toFloat(stringValue);
          case PostgresTypes.oid:
            return exports.toInt(stringValue);
          case PostgresTypes.reltime:
            return noop2(stringValue);
          case PostgresTypes.time:
            return noop2(stringValue);
          case PostgresTypes.timestamp:
            return exports.toTimestampString(stringValue);
          case PostgresTypes.timestamptz:
            return noop2(stringValue);
          case PostgresTypes.timetz:
            return noop2(stringValue);
          case PostgresTypes.tsrange:
            return exports.toDateRange(stringValue);
          case PostgresTypes.tstzrange:
            return exports.toDateRange(stringValue);
          default:
            return noop2(stringValue);
        }
      } catch (error2) {
        console.log(`Could not convert cell of type ${type} and value ${stringValue}`);
        console.log(`This is the error: ${error2}`);
        return stringValue;
      }
    };
    var noop2 = (stringValue) => {
      return stringValue;
    };
    exports.toBoolean = (stringValue) => {
      switch (stringValue) {
        case "t":
          return true;
        case "f":
          return false;
        default:
          return null;
      }
    };
    exports.toDate = (stringValue) => {
      return new Date(stringValue);
    };
    exports.toDateRange = (stringValue) => {
      let arr = JSON.parse(stringValue);
      return [new Date(arr[0]), new Date(arr[1])];
    };
    exports.toFloat = (stringValue) => {
      return parseFloat(stringValue);
    };
    exports.toInt = (stringValue) => {
      return parseInt(stringValue);
    };
    exports.toIntRange = (stringValue) => {
      let arr = JSON.parse(stringValue);
      return [parseInt(arr[0]), parseInt(arr[1])];
    };
    exports.toJson = (stringValue) => {
      return JSON.parse(stringValue);
    };
    exports.toArray = (stringValue, type) => {
      let stringEnriched = stringValue.slice(1, stringValue.length - 1);
      let stringArray = stringEnriched.length > 0 ? stringEnriched.split(",") : [];
      let array = stringArray.map((string) => {
        return exports.convertCell(type, string);
      });
      return array;
    };
    exports.toTimestampString = (stringValue) => {
      return stringValue.replace(" ", "T");
    };
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/version.js
var require_version4 = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/version.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "1.1.3";
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/constants.js
var require_constants4 = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TRANSPORTS = exports.CHANNEL_EVENTS = exports.CHANNEL_STATES = exports.SOCKET_STATES = exports.WS_CLOSE_NORMAL = exports.DEFAULT_TIMEOUT = exports.VSN = exports.DEFAULT_HEADERS = void 0;
    var version_1 = require_version4();
    exports.DEFAULT_HEADERS = { "X-Client-Info": `realtime-js/${version_1.version}` };
    exports.VSN = "1.0.0";
    exports.DEFAULT_TIMEOUT = 1e4;
    exports.WS_CLOSE_NORMAL = 1e3;
    var SOCKET_STATES;
    (function(SOCKET_STATES2) {
      SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
      SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
      SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
      SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
    })(SOCKET_STATES = exports.SOCKET_STATES || (exports.SOCKET_STATES = {}));
    var CHANNEL_STATES;
    (function(CHANNEL_STATES2) {
      CHANNEL_STATES2["closed"] = "closed";
      CHANNEL_STATES2["errored"] = "errored";
      CHANNEL_STATES2["joined"] = "joined";
      CHANNEL_STATES2["joining"] = "joining";
      CHANNEL_STATES2["leaving"] = "leaving";
    })(CHANNEL_STATES = exports.CHANNEL_STATES || (exports.CHANNEL_STATES = {}));
    var CHANNEL_EVENTS;
    (function(CHANNEL_EVENTS2) {
      CHANNEL_EVENTS2["close"] = "phx_close";
      CHANNEL_EVENTS2["error"] = "phx_error";
      CHANNEL_EVENTS2["join"] = "phx_join";
      CHANNEL_EVENTS2["reply"] = "phx_reply";
      CHANNEL_EVENTS2["leave"] = "phx_leave";
    })(CHANNEL_EVENTS = exports.CHANNEL_EVENTS || (exports.CHANNEL_EVENTS = {}));
    var TRANSPORTS;
    (function(TRANSPORTS2) {
      TRANSPORTS2["websocket"] = "websocket";
    })(TRANSPORTS = exports.TRANSPORTS || (exports.TRANSPORTS = {}));
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/timer.js
var require_timer = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/timer.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Timer = class {
      constructor(callback, timerCalc) {
        this.callback = callback;
        this.timerCalc = timerCalc;
        this.timer = void 0;
        this.tries = 0;
        this.callback = callback;
        this.timerCalc = timerCalc;
      }
      reset() {
        this.tries = 0;
        clearTimeout(this.timer);
      }
      scheduleTimeout() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.tries = this.tries + 1;
          this.callback();
        }, this.timerCalc(this.tries + 1));
      }
    };
    exports.default = Timer;
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/push.js
var require_push = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/push.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var constants_1 = require_constants4();
    var Push = class {
      constructor(channel, event, payload = {}, timeout = constants_1.DEFAULT_TIMEOUT) {
        this.channel = channel;
        this.event = event;
        this.payload = payload;
        this.timeout = timeout;
        this.sent = false;
        this.timeoutTimer = void 0;
        this.ref = "";
        this.receivedResp = null;
        this.recHooks = [];
        this.refEvent = null;
      }
      resend(timeout) {
        this.timeout = timeout;
        this._cancelRefEvent();
        this.ref = "";
        this.refEvent = null;
        this.receivedResp = null;
        this.sent = false;
        this.send();
      }
      send() {
        if (this._hasReceived("timeout")) {
          return;
        }
        this.startTimeout();
        this.sent = true;
        this.channel.socket.push({
          topic: this.channel.topic,
          event: this.event,
          payload: this.payload,
          ref: this.ref
        });
      }
      receive(status, callback) {
        var _a;
        if (this._hasReceived(status)) {
          callback((_a = this.receivedResp) === null || _a === void 0 ? void 0 : _a.response);
        }
        this.recHooks.push({ status, callback });
        return this;
      }
      startTimeout() {
        if (this.timeoutTimer) {
          return;
        }
        this.ref = this.channel.socket.makeRef();
        this.refEvent = this.channel.replyEventName(this.ref);
        this.channel.on(this.refEvent, (payload) => {
          this._cancelRefEvent();
          this._cancelTimeout();
          this.receivedResp = payload;
          this._matchReceive(payload);
        });
        this.timeoutTimer = setTimeout(() => {
          this.trigger("timeout", {});
        }, this.timeout);
      }
      trigger(status, response) {
        if (this.refEvent)
          this.channel.trigger(this.refEvent, { status, response });
      }
      destroy() {
        this._cancelRefEvent();
        this._cancelTimeout();
      }
      _cancelRefEvent() {
        if (!this.refEvent) {
          return;
        }
        this.channel.off(this.refEvent);
      }
      _cancelTimeout() {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = void 0;
      }
      _matchReceive({ status, response }) {
        this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
      }
      _hasReceived(status) {
        return this.receivedResp && this.receivedResp.status === status;
      }
    };
    exports.default = Push;
  }
});

// node_modules/@supabase/realtime-js/dist/main/RealtimeSubscription.js
var require_RealtimeSubscription = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/RealtimeSubscription.js"(exports) {
    init_shims();
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var constants_1 = require_constants4();
    var push_1 = __importDefault(require_push());
    var timer_1 = __importDefault(require_timer());
    var RealtimeSubscription = class {
      constructor(topic, params = {}, socket) {
        this.topic = topic;
        this.params = params;
        this.socket = socket;
        this.bindings = [];
        this.state = constants_1.CHANNEL_STATES.closed;
        this.joinedOnce = false;
        this.pushBuffer = [];
        this.timeout = this.socket.timeout;
        this.joinPush = new push_1.default(this, constants_1.CHANNEL_EVENTS.join, this.params, this.timeout);
        this.rejoinTimer = new timer_1.default(() => this.rejoinUntilConnected(), this.socket.reconnectAfterMs);
        this.joinPush.receive("ok", () => {
          this.state = constants_1.CHANNEL_STATES.joined;
          this.rejoinTimer.reset();
          this.pushBuffer.forEach((pushEvent) => pushEvent.send());
          this.pushBuffer = [];
        });
        this.onClose(() => {
          this.rejoinTimer.reset();
          this.socket.log("channel", `close ${this.topic} ${this.joinRef()}`);
          this.state = constants_1.CHANNEL_STATES.closed;
          this.socket.remove(this);
        });
        this.onError((reason) => {
          if (this.isLeaving() || this.isClosed()) {
            return;
          }
          this.socket.log("channel", `error ${this.topic}`, reason);
          this.state = constants_1.CHANNEL_STATES.errored;
          this.rejoinTimer.scheduleTimeout();
        });
        this.joinPush.receive("timeout", () => {
          if (!this.isJoining()) {
            return;
          }
          this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
          this.state = constants_1.CHANNEL_STATES.errored;
          this.rejoinTimer.scheduleTimeout();
        });
        this.on(constants_1.CHANNEL_EVENTS.reply, (payload, ref) => {
          this.trigger(this.replyEventName(ref), payload);
        });
      }
      rejoinUntilConnected() {
        this.rejoinTimer.scheduleTimeout();
        if (this.socket.isConnected()) {
          this.rejoin();
        }
      }
      subscribe(timeout = this.timeout) {
        if (this.joinedOnce) {
          throw `tried to subscribe multiple times. 'subscribe' can only be called a single time per channel instance`;
        } else {
          this.joinedOnce = true;
          this.rejoin(timeout);
          return this.joinPush;
        }
      }
      onClose(callback) {
        this.on(constants_1.CHANNEL_EVENTS.close, callback);
      }
      onError(callback) {
        this.on(constants_1.CHANNEL_EVENTS.error, (reason) => callback(reason));
      }
      on(event, callback) {
        this.bindings.push({ event, callback });
      }
      off(event) {
        this.bindings = this.bindings.filter((bind) => bind.event !== event);
      }
      canPush() {
        return this.socket.isConnected() && this.isJoined();
      }
      push(event, payload, timeout = this.timeout) {
        if (!this.joinedOnce) {
          throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
        }
        let pushEvent = new push_1.default(this, event, payload, timeout);
        if (this.canPush()) {
          pushEvent.send();
        } else {
          pushEvent.startTimeout();
          this.pushBuffer.push(pushEvent);
        }
        return pushEvent;
      }
      unsubscribe(timeout = this.timeout) {
        this.state = constants_1.CHANNEL_STATES.leaving;
        let onClose = () => {
          this.socket.log("channel", `leave ${this.topic}`);
          this.trigger(constants_1.CHANNEL_EVENTS.close, "leave", this.joinRef());
        };
        this.joinPush.destroy();
        let leavePush = new push_1.default(this, constants_1.CHANNEL_EVENTS.leave, {}, timeout);
        leavePush.receive("ok", () => onClose()).receive("timeout", () => onClose());
        leavePush.send();
        if (!this.canPush()) {
          leavePush.trigger("ok", {});
        }
        return leavePush;
      }
      onMessage(event, payload, ref) {
        return payload;
      }
      isMember(topic) {
        return this.topic === topic;
      }
      joinRef() {
        return this.joinPush.ref;
      }
      sendJoin(timeout) {
        this.state = constants_1.CHANNEL_STATES.joining;
        this.joinPush.resend(timeout);
      }
      rejoin(timeout = this.timeout) {
        if (this.isLeaving()) {
          return;
        }
        this.sendJoin(timeout);
      }
      trigger(event, payload, ref) {
        let { close, error: error2, leave, join } = constants_1.CHANNEL_EVENTS;
        let events = [close, error2, leave, join];
        if (ref && events.indexOf(event) >= 0 && ref !== this.joinRef()) {
          return;
        }
        let handledPayload = this.onMessage(event, payload, ref);
        if (payload && !handledPayload) {
          throw "channel onMessage callbacks must return the payload, modified or unmodified";
        }
        this.bindings.filter((bind) => {
          if (bind.event === "*") {
            return event === (payload === null || payload === void 0 ? void 0 : payload.type);
          } else {
            return bind.event === event;
          }
        }).map((bind) => bind.callback(handledPayload, ref));
      }
      replyEventName(ref) {
        return `chan_reply_${ref}`;
      }
      isClosed() {
        return this.state === constants_1.CHANNEL_STATES.closed;
      }
      isErrored() {
        return this.state === constants_1.CHANNEL_STATES.errored;
      }
      isJoined() {
        return this.state === constants_1.CHANNEL_STATES.joined;
      }
      isJoining() {
        return this.state === constants_1.CHANNEL_STATES.joining;
      }
      isLeaving() {
        return this.state === constants_1.CHANNEL_STATES.leaving;
      }
    };
    exports.default = RealtimeSubscription;
  }
});

// node_modules/websocket/node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/websocket/node_modules/ms/index.js"(exports, module2) {
    init_shims();
    var s2 = 1e3;
    var m = s2 * 60;
    var h = m * 60;
    var d2 = h * 24;
    var y = d2 * 365.25;
    module2.exports = function(val, options2) {
      options2 = options2 || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isNaN(val) === false) {
        return options2.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "days":
        case "day":
        case "d":
          return n * d2;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s2;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      if (ms >= d2) {
        return Math.round(ms / d2) + "d";
      }
      if (ms >= h) {
        return Math.round(ms / h) + "h";
      }
      if (ms >= m) {
        return Math.round(ms / m) + "m";
      }
      if (ms >= s2) {
        return Math.round(ms / s2) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      return plural(ms, d2, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s2, "second") || ms + " ms";
    }
    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + " " + name;
      }
      return Math.ceil(ms / n) + " " + name + "s";
    }
  }
});

// node_modules/websocket/node_modules/debug/src/debug.js
var require_debug = __commonJS({
  "node_modules/websocket/node_modules/debug/src/debug.js"(exports, module2) {
    init_shims();
    exports = module2.exports = createDebug.debug = createDebug["default"] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = require_ms();
    exports.names = [];
    exports.skips = [];
    exports.formatters = {};
    var prevTime;
    function selectColor(namespace) {
      var hash2 = 0, i;
      for (i in namespace) {
        hash2 = (hash2 << 5) - hash2 + namespace.charCodeAt(i);
        hash2 |= 0;
      }
      return exports.colors[Math.abs(hash2) % exports.colors.length];
    }
    function createDebug(namespace) {
      function debug() {
        if (!debug.enabled)
          return;
        var self2 = debug;
        var curr = +new Date();
        var ms = curr - (prevTime || curr);
        self2.diff = ms;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        args[0] = exports.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        var index2 = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format2) {
          if (match === "%%")
            return match;
          index2++;
          var formatter = exports.formatters[format2];
          if (typeof formatter === "function") {
            var val = args[index2];
            match = formatter.call(self2, val);
            args.splice(index2, 1);
            index2--;
          }
          return match;
        });
        exports.formatArgs.call(self2, args);
        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self2, args);
      }
      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);
      if (typeof exports.init === "function") {
        exports.init(debug);
      }
      return debug;
    }
    function enable(namespaces) {
      exports.save(namespaces);
      exports.names = [];
      exports.skips = [];
      var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
      var len = split.length;
      for (var i = 0; i < len; i++) {
        if (!split[i])
          continue;
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports.names.push(new RegExp("^" + namespaces + "$"));
        }
      }
    }
    function disable() {
      exports.enable("");
    }
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error)
        return val.stack || val.message;
      return val;
    }
  }
});

// node_modules/websocket/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/websocket/node_modules/debug/src/browser.js"(exports, module2) {
    init_shims();
    exports = module2.exports = require_debug();
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load2;
    exports.useColors = useColors;
    exports.storage = typeof chrome != "undefined" && typeof chrome.storage != "undefined" ? chrome.storage.local : localstorage();
    exports.colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
        return true;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };
    function formatArgs(args) {
      var useColors2 = this.useColors;
      args[0] = (useColors2 ? "%c" : "") + this.namespace + (useColors2 ? " %c" : " ") + args[0] + (useColors2 ? "%c " : " ") + "+" + exports.humanize(this.diff);
      if (!useColors2)
        return;
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index2 = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if (match === "%%")
          return;
        index2++;
        if (match === "%c") {
          lastC = index2;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      return typeof console === "object" && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    function save(namespaces) {
      try {
        if (namespaces == null) {
          exports.storage.removeItem("debug");
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {
      }
    }
    function load2() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    exports.enable(load2());
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {
      }
    }
  }
});

// node_modules/websocket/node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/websocket/node_modules/debug/src/node.js"(exports, module2) {
    init_shims();
    var tty = require("tty");
    var util = require("util");
    exports = module2.exports = require_debug();
    exports.init = init2;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load2;
    exports.useColors = useColors;
    exports.colors = [6, 2, 3, 4, 5, 1];
    exports.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val))
        val = true;
      else if (/^(no|off|false|disabled)$/i.test(val))
        val = false;
      else if (val === "null")
        val = null;
      else
        val = Number(val);
      obj[prop] = val;
      return obj;
    }, {});
    var fd = parseInt(process.env.DEBUG_FD, 10) || 2;
    if (fd !== 1 && fd !== 2) {
      util.deprecate(function() {
      }, "except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)")();
    }
    var stream = fd === 1 ? process.stdout : fd === 2 ? process.stderr : createWritableStdioStream(fd);
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(fd);
    }
    exports.formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    exports.formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
    function formatArgs(args) {
      var name = this.namespace;
      var useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var prefix = "  [3" + c + ";1m" + name + " [0m";
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push("[3" + c + "m+" + exports.humanize(this.diff) + "[0m");
      } else {
        args[0] = new Date().toUTCString() + " " + name + " " + args[0];
      }
    }
    function log() {
      return stream.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (namespaces == null) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }
    function load2() {
      return process.env.DEBUG;
    }
    function createWritableStdioStream(fd2) {
      var stream2;
      var tty_wrap = process.binding("tty_wrap");
      switch (tty_wrap.guessHandleType(fd2)) {
        case "TTY":
          stream2 = new tty.WriteStream(fd2);
          stream2._type = "tty";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        case "FILE":
          var fs = require("fs");
          stream2 = new fs.SyncWriteStream(fd2, { autoClose: false });
          stream2._type = "fs";
          break;
        case "PIPE":
        case "TCP":
          var net = require("net");
          stream2 = new net.Socket({
            fd: fd2,
            readable: false,
            writable: true
          });
          stream2.readable = false;
          stream2.read = null;
          stream2._type = "pipe";
          if (stream2._handle && stream2._handle.unref) {
            stream2._handle.unref();
          }
          break;
        default:
          throw new Error("Implement me. Unknown stream file type!");
      }
      stream2.fd = fd2;
      stream2._isStdio = true;
      return stream2;
    }
    function init2(debug) {
      debug.inspectOpts = {};
      var keys = Object.keys(exports.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    exports.enable(load2());
  }
});

// node_modules/websocket/node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/websocket/node_modules/debug/src/index.js"(exports, module2) {
    init_shims();
    if (typeof process !== "undefined" && process.type === "renderer") {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// node_modules/websocket/lib/utils.js
var require_utils = __commonJS({
  "node_modules/websocket/lib/utils.js"(exports) {
    init_shims();
    var noop2 = exports.noop = function() {
    };
    exports.extend = function extend(dest, source) {
      for (var prop in source) {
        dest[prop] = source[prop];
      }
    };
    exports.eventEmitterListenerCount = require("events").EventEmitter.listenerCount || function(emitter, type) {
      return emitter.listeners(type).length;
    };
    exports.bufferAllocUnsafe = Buffer.allocUnsafe ? Buffer.allocUnsafe : function oldBufferAllocUnsafe(size) {
      return new Buffer(size);
    };
    exports.bufferFromString = Buffer.from ? Buffer.from : function oldBufferFromString(string, encoding) {
      return new Buffer(string, encoding);
    };
    exports.BufferingLogger = function createBufferingLogger(identifier, uniqueID) {
      var logFunction = require_src()(identifier);
      if (logFunction.enabled) {
        var logger = new BufferingLogger(identifier, uniqueID, logFunction);
        var debug = logger.log.bind(logger);
        debug.printOutput = logger.printOutput.bind(logger);
        debug.enabled = logFunction.enabled;
        return debug;
      }
      logFunction.printOutput = noop2;
      return logFunction;
    };
    function BufferingLogger(identifier, uniqueID, logFunction) {
      this.logFunction = logFunction;
      this.identifier = identifier;
      this.uniqueID = uniqueID;
      this.buffer = [];
    }
    BufferingLogger.prototype.log = function() {
      this.buffer.push([new Date(), Array.prototype.slice.call(arguments)]);
      return this;
    };
    BufferingLogger.prototype.clear = function() {
      this.buffer = [];
      return this;
    };
    BufferingLogger.prototype.printOutput = function(logFunction) {
      if (!logFunction) {
        logFunction = this.logFunction;
      }
      var uniqueID = this.uniqueID;
      this.buffer.forEach(function(entry) {
        var date = entry[0].toLocaleString();
        var args = entry[1].slice();
        var formatString = args[0];
        if (formatString !== void 0 && formatString !== null) {
          formatString = "%s - %s - " + formatString.toString();
          args.splice(0, 1, formatString, date, uniqueID);
          logFunction.apply(global, args);
        }
      });
    };
  }
});

// node_modules/node-gyp-build/index.js
var require_node_gyp_build = __commonJS({
  "node_modules/node-gyp-build/index.js"(exports, module2) {
    init_shims();
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
    var vars = process.config && process.config.variables || {};
    var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
    var abi = process.versions.modules;
    var runtime = isElectron() ? "electron" : "node";
    var arch = os.arch();
    var platform = os.platform();
    var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
    var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
    var uv = (process.versions.uv || "").split(".")[0];
    module2.exports = load2;
    function load2(dir) {
      return runtimeRequire(load2.path(dir));
    }
    load2.path = function(dir) {
      dir = path.resolve(dir || ".");
      try {
        var name = runtimeRequire(path.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
        if (process.env[name + "_PREBUILD"])
          dir = process.env[name + "_PREBUILD"];
      } catch (err) {
      }
      if (!prebuildsOnly) {
        var release = getFirst(path.join(dir, "build/Release"), matchBuild);
        if (release)
          return release;
        var debug = getFirst(path.join(dir, "build/Debug"), matchBuild);
        if (debug)
          return debug;
      }
      var prebuild = resolve2(dir);
      if (prebuild)
        return prebuild;
      var nearby = resolve2(path.dirname(process.execPath));
      if (nearby)
        return nearby;
      var target = [
        "platform=" + platform,
        "arch=" + arch,
        "runtime=" + runtime,
        "abi=" + abi,
        "uv=" + uv,
        armv ? "armv=" + armv : "",
        "libc=" + libc,
        "node=" + process.versions.node,
        process.versions.electron ? "electron=" + process.versions.electron : "",
        typeof __webpack_require__ === "function" ? "webpack=true" : ""
      ].filter(Boolean).join(" ");
      throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
      function resolve2(dir2) {
        var tuples = readdirSync(path.join(dir2, "prebuilds")).map(parseTuple);
        var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
        if (!tuple)
          return;
        var prebuilds = path.join(dir2, "prebuilds", tuple.name);
        var parsed = readdirSync(prebuilds).map(parseTags);
        var candidates = parsed.filter(matchTags(runtime, abi));
        var winner = candidates.sort(compareTags(runtime))[0];
        if (winner)
          return path.join(prebuilds, winner.file);
      }
    };
    function readdirSync(dir) {
      try {
        return fs.readdirSync(dir);
      } catch (err) {
        return [];
      }
    }
    function getFirst(dir, filter) {
      var files = readdirSync(dir).filter(filter);
      return files[0] && path.join(dir, files[0]);
    }
    function matchBuild(name) {
      return /\.node$/.test(name);
    }
    function parseTuple(name) {
      var arr = name.split("-");
      if (arr.length !== 2)
        return;
      var platform2 = arr[0];
      var architectures = arr[1].split("+");
      if (!platform2)
        return;
      if (!architectures.length)
        return;
      if (!architectures.every(Boolean))
        return;
      return { name, platform: platform2, architectures };
    }
    function matchTuple(platform2, arch2) {
      return function(tuple) {
        if (tuple == null)
          return false;
        if (tuple.platform !== platform2)
          return false;
        return tuple.architectures.includes(arch2);
      };
    }
    function compareTuples(a, b) {
      return a.architectures.length - b.architectures.length;
    }
    function parseTags(file) {
      var arr = file.split(".");
      var extension = arr.pop();
      var tags = { file, specificity: 0 };
      if (extension !== "node")
        return;
      for (var i = 0; i < arr.length; i++) {
        var tag = arr[i];
        if (tag === "node" || tag === "electron" || tag === "node-webkit") {
          tags.runtime = tag;
        } else if (tag === "napi") {
          tags.napi = true;
        } else if (tag.slice(0, 3) === "abi") {
          tags.abi = tag.slice(3);
        } else if (tag.slice(0, 2) === "uv") {
          tags.uv = tag.slice(2);
        } else if (tag.slice(0, 4) === "armv") {
          tags.armv = tag.slice(4);
        } else if (tag === "glibc" || tag === "musl") {
          tags.libc = tag;
        } else {
          continue;
        }
        tags.specificity++;
      }
      return tags;
    }
    function matchTags(runtime2, abi2) {
      return function(tags) {
        if (tags == null)
          return false;
        if (tags.runtime !== runtime2 && !runtimeAgnostic(tags))
          return false;
        if (tags.abi !== abi2 && !tags.napi)
          return false;
        if (tags.uv && tags.uv !== uv)
          return false;
        if (tags.armv && tags.armv !== armv)
          return false;
        if (tags.libc && tags.libc !== libc)
          return false;
        return true;
      };
    }
    function runtimeAgnostic(tags) {
      return tags.runtime === "node" && tags.napi;
    }
    function compareTags(runtime2) {
      return function(a, b) {
        if (a.runtime !== b.runtime) {
          return a.runtime === runtime2 ? -1 : 1;
        } else if (a.abi !== b.abi) {
          return a.abi ? -1 : 1;
        } else if (a.specificity !== b.specificity) {
          return a.specificity > b.specificity ? -1 : 1;
        } else {
          return 0;
        }
      };
    }
    function isElectron() {
      if (process.versions && process.versions.electron)
        return true;
      if (process.env.ELECTRON_RUN_AS_NODE)
        return true;
      return typeof window !== "undefined" && window.process && window.process.type === "renderer";
    }
    function isAlpine(platform2) {
      return platform2 === "linux" && fs.existsSync("/etc/alpine-release");
    }
    load2.parseTags = parseTags;
    load2.matchTags = matchTags;
    load2.compareTags = compareTags;
    load2.parseTuple = parseTuple;
    load2.matchTuple = matchTuple;
    load2.compareTuples = compareTuples;
  }
});

// node_modules/bufferutil/fallback.js
var require_fallback = __commonJS({
  "node_modules/bufferutil/fallback.js"(exports, module2) {
    init_shims();
    "use strict";
    var mask = (source, mask2, output, offset, length) => {
      for (var i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask2[i & 3];
      }
    };
    var unmask = (buffer, mask2) => {
      const length = buffer.length;
      for (var i = 0; i < length; i++) {
        buffer[i] ^= mask2[i & 3];
      }
    };
    module2.exports = { mask, unmask };
  }
});

// node_modules/bufferutil/index.js
var require_bufferutil = __commonJS({
  "node_modules/bufferutil/index.js"(exports, module2) {
    init_shims();
    "use strict";
    try {
      module2.exports = require_node_gyp_build()(__dirname);
    } catch (e) {
      module2.exports = require_fallback();
    }
  }
});

// node_modules/websocket/lib/WebSocketFrame.js
var require_WebSocketFrame = __commonJS({
  "node_modules/websocket/lib/WebSocketFrame.js"(exports, module2) {
    init_shims();
    var bufferUtil = require_bufferutil();
    var bufferAllocUnsafe = require_utils().bufferAllocUnsafe;
    var DECODE_HEADER = 1;
    var WAITING_FOR_16_BIT_LENGTH = 2;
    var WAITING_FOR_64_BIT_LENGTH = 3;
    var WAITING_FOR_MASK_KEY = 4;
    var WAITING_FOR_PAYLOAD = 5;
    var COMPLETE = 6;
    function WebSocketFrame(maskBytes, frameHeader, config) {
      this.maskBytes = maskBytes;
      this.frameHeader = frameHeader;
      this.config = config;
      this.maxReceivedFrameSize = config.maxReceivedFrameSize;
      this.protocolError = false;
      this.frameTooLarge = false;
      this.invalidCloseFrameLength = false;
      this.parseState = DECODE_HEADER;
      this.closeStatus = -1;
    }
    WebSocketFrame.prototype.addData = function(bufferList) {
      if (this.parseState === DECODE_HEADER) {
        if (bufferList.length >= 2) {
          bufferList.joinInto(this.frameHeader, 0, 0, 2);
          bufferList.advance(2);
          var firstByte = this.frameHeader[0];
          var secondByte = this.frameHeader[1];
          this.fin = Boolean(firstByte & 128);
          this.rsv1 = Boolean(firstByte & 64);
          this.rsv2 = Boolean(firstByte & 32);
          this.rsv3 = Boolean(firstByte & 16);
          this.mask = Boolean(secondByte & 128);
          this.opcode = firstByte & 15;
          this.length = secondByte & 127;
          if (this.opcode >= 8) {
            if (this.length > 125) {
              this.protocolError = true;
              this.dropReason = "Illegal control frame longer than 125 bytes.";
              return true;
            }
            if (!this.fin) {
              this.protocolError = true;
              this.dropReason = "Control frames must not be fragmented.";
              return true;
            }
          }
          if (this.length === 126) {
            this.parseState = WAITING_FOR_16_BIT_LENGTH;
          } else if (this.length === 127) {
            this.parseState = WAITING_FOR_64_BIT_LENGTH;
          } else {
            this.parseState = WAITING_FOR_MASK_KEY;
          }
        }
      }
      if (this.parseState === WAITING_FOR_16_BIT_LENGTH) {
        if (bufferList.length >= 2) {
          bufferList.joinInto(this.frameHeader, 2, 0, 2);
          bufferList.advance(2);
          this.length = this.frameHeader.readUInt16BE(2);
          this.parseState = WAITING_FOR_MASK_KEY;
        }
      } else if (this.parseState === WAITING_FOR_64_BIT_LENGTH) {
        if (bufferList.length >= 8) {
          bufferList.joinInto(this.frameHeader, 2, 0, 8);
          bufferList.advance(8);
          var lengthPair = [
            this.frameHeader.readUInt32BE(2),
            this.frameHeader.readUInt32BE(2 + 4)
          ];
          if (lengthPair[0] !== 0) {
            this.protocolError = true;
            this.dropReason = "Unsupported 64-bit length frame received";
            return true;
          }
          this.length = lengthPair[1];
          this.parseState = WAITING_FOR_MASK_KEY;
        }
      }
      if (this.parseState === WAITING_FOR_MASK_KEY) {
        if (this.mask) {
          if (bufferList.length >= 4) {
            bufferList.joinInto(this.maskBytes, 0, 0, 4);
            bufferList.advance(4);
            this.parseState = WAITING_FOR_PAYLOAD;
          }
        } else {
          this.parseState = WAITING_FOR_PAYLOAD;
        }
      }
      if (this.parseState === WAITING_FOR_PAYLOAD) {
        if (this.length > this.maxReceivedFrameSize) {
          this.frameTooLarge = true;
          this.dropReason = "Frame size of " + this.length.toString(10) + " bytes exceeds maximum accepted frame size";
          return true;
        }
        if (this.length === 0) {
          this.binaryPayload = bufferAllocUnsafe(0);
          this.parseState = COMPLETE;
          return true;
        }
        if (bufferList.length >= this.length) {
          this.binaryPayload = bufferList.take(this.length);
          bufferList.advance(this.length);
          if (this.mask) {
            bufferUtil.unmask(this.binaryPayload, this.maskBytes);
          }
          if (this.opcode === 8) {
            if (this.length === 1) {
              this.binaryPayload = bufferAllocUnsafe(0);
              this.invalidCloseFrameLength = true;
            }
            if (this.length >= 2) {
              this.closeStatus = this.binaryPayload.readUInt16BE(0);
              this.binaryPayload = this.binaryPayload.slice(2);
            }
          }
          this.parseState = COMPLETE;
          return true;
        }
      }
      return false;
    };
    WebSocketFrame.prototype.throwAwayPayload = function(bufferList) {
      if (bufferList.length >= this.length) {
        bufferList.advance(this.length);
        this.parseState = COMPLETE;
        return true;
      }
      return false;
    };
    WebSocketFrame.prototype.toBuffer = function(nullMask) {
      var maskKey;
      var headerLength = 2;
      var data;
      var outputPos;
      var firstByte = 0;
      var secondByte = 0;
      if (this.fin) {
        firstByte |= 128;
      }
      if (this.rsv1) {
        firstByte |= 64;
      }
      if (this.rsv2) {
        firstByte |= 32;
      }
      if (this.rsv3) {
        firstByte |= 16;
      }
      if (this.mask) {
        secondByte |= 128;
      }
      firstByte |= this.opcode & 15;
      if (this.opcode === 8) {
        this.length = 2;
        if (this.binaryPayload) {
          this.length += this.binaryPayload.length;
        }
        data = bufferAllocUnsafe(this.length);
        data.writeUInt16BE(this.closeStatus, 0);
        if (this.length > 2) {
          this.binaryPayload.copy(data, 2);
        }
      } else if (this.binaryPayload) {
        data = this.binaryPayload;
        this.length = data.length;
      } else {
        this.length = 0;
      }
      if (this.length <= 125) {
        secondByte |= this.length & 127;
      } else if (this.length > 125 && this.length <= 65535) {
        secondByte |= 126;
        headerLength += 2;
      } else if (this.length > 65535) {
        secondByte |= 127;
        headerLength += 8;
      }
      var output = bufferAllocUnsafe(this.length + headerLength + (this.mask ? 4 : 0));
      output[0] = firstByte;
      output[1] = secondByte;
      outputPos = 2;
      if (this.length > 125 && this.length <= 65535) {
        output.writeUInt16BE(this.length, outputPos);
        outputPos += 2;
      } else if (this.length > 65535) {
        output.writeUInt32BE(0, outputPos);
        output.writeUInt32BE(this.length, outputPos + 4);
        outputPos += 8;
      }
      if (this.mask) {
        maskKey = nullMask ? 0 : Math.random() * 4294967295 >>> 0;
        this.maskBytes.writeUInt32BE(maskKey, 0);
        this.maskBytes.copy(output, outputPos);
        outputPos += 4;
        if (data) {
          bufferUtil.mask(data, this.maskBytes, output, outputPos, this.length);
        }
      } else if (data) {
        data.copy(output, outputPos);
      }
      return output;
    };
    WebSocketFrame.prototype.toString = function() {
      return "Opcode: " + this.opcode + ", fin: " + this.fin + ", length: " + this.length + ", hasPayload: " + Boolean(this.binaryPayload) + ", masked: " + this.mask;
    };
    module2.exports = WebSocketFrame;
  }
});

// node_modules/websocket/vendor/FastBufferList.js
var require_FastBufferList = __commonJS({
  "node_modules/websocket/vendor/FastBufferList.js"(exports, module2) {
    init_shims();
    var Buffer2 = require("buffer").Buffer;
    var EventEmitter = require("events").EventEmitter;
    var bufferAllocUnsafe = require_utils().bufferAllocUnsafe;
    module2.exports = BufferList;
    module2.exports.BufferList = BufferList;
    function BufferList(opts) {
      if (!(this instanceof BufferList))
        return new BufferList(opts);
      EventEmitter.call(this);
      var self2 = this;
      if (typeof opts == "undefined")
        opts = {};
      self2.encoding = opts.encoding;
      var head = { next: null, buffer: null };
      var last = { next: null, buffer: null };
      var length = 0;
      self2.__defineGetter__("length", function() {
        return length;
      });
      var offset = 0;
      self2.write = function(buf) {
        if (!head.buffer) {
          head.buffer = buf;
          last = head;
        } else {
          last.next = { next: null, buffer: buf };
          last = last.next;
        }
        length += buf.length;
        self2.emit("write", buf);
        return true;
      };
      self2.end = function(buf) {
        if (Buffer2.isBuffer(buf))
          self2.write(buf);
      };
      self2.push = function() {
        var args = [].concat.apply([], arguments);
        args.forEach(self2.write);
        return self2;
      };
      self2.forEach = function(fn) {
        if (!head.buffer)
          return bufferAllocUnsafe(0);
        if (head.buffer.length - offset <= 0)
          return self2;
        var firstBuf = head.buffer.slice(offset);
        var b = { buffer: firstBuf, next: head.next };
        while (b && b.buffer) {
          var r = fn(b.buffer);
          if (r)
            break;
          b = b.next;
        }
        return self2;
      };
      self2.join = function(start, end) {
        if (!head.buffer)
          return bufferAllocUnsafe(0);
        if (start == void 0)
          start = 0;
        if (end == void 0)
          end = self2.length;
        var big = bufferAllocUnsafe(end - start);
        var ix = 0;
        self2.forEach(function(buffer) {
          if (start < ix + buffer.length && ix < end) {
            buffer.copy(big, Math.max(0, ix - start), Math.max(0, start - ix), Math.min(buffer.length, end - ix));
          }
          ix += buffer.length;
          if (ix > end)
            return true;
        });
        return big;
      };
      self2.joinInto = function(targetBuffer, targetStart, sourceStart, sourceEnd) {
        if (!head.buffer)
          return new bufferAllocUnsafe(0);
        if (sourceStart == void 0)
          sourceStart = 0;
        if (sourceEnd == void 0)
          sourceEnd = self2.length;
        var big = targetBuffer;
        if (big.length - targetStart < sourceEnd - sourceStart) {
          throw new Error("Insufficient space available in target Buffer.");
        }
        var ix = 0;
        self2.forEach(function(buffer) {
          if (sourceStart < ix + buffer.length && ix < sourceEnd) {
            buffer.copy(big, Math.max(targetStart, targetStart + ix - sourceStart), Math.max(0, sourceStart - ix), Math.min(buffer.length, sourceEnd - ix));
          }
          ix += buffer.length;
          if (ix > sourceEnd)
            return true;
        });
        return big;
      };
      self2.advance = function(n) {
        offset += n;
        length -= n;
        while (head.buffer && offset >= head.buffer.length) {
          offset -= head.buffer.length;
          head = head.next ? head.next : { buffer: null, next: null };
        }
        if (head.buffer === null)
          last = { next: null, buffer: null };
        self2.emit("advance", n);
        return self2;
      };
      self2.take = function(n, encoding) {
        if (n == void 0)
          n = self2.length;
        else if (typeof n !== "number") {
          encoding = n;
          n = self2.length;
        }
        var b = head;
        if (!encoding)
          encoding = self2.encoding;
        if (encoding) {
          var acc = "";
          self2.forEach(function(buffer) {
            if (n <= 0)
              return true;
            acc += buffer.toString(encoding, 0, Math.min(n, buffer.length));
            n -= buffer.length;
          });
          return acc;
        } else {
          return self2.join(0, n);
        }
      };
      self2.toString = function() {
        return self2.take("binary");
      };
    }
    require("util").inherits(BufferList, EventEmitter);
  }
});

// node_modules/utf-8-validate/fallback.js
var require_fallback2 = __commonJS({
  "node_modules/utf-8-validate/fallback.js"(exports, module2) {
    init_shims();
    "use strict";
    function isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    module2.exports = isValidUTF8;
  }
});

// node_modules/utf-8-validate/index.js
var require_utf_8_validate = __commonJS({
  "node_modules/utf-8-validate/index.js"(exports, module2) {
    init_shims();
    "use strict";
    try {
      module2.exports = require_node_gyp_build()(__dirname);
    } catch (e) {
      module2.exports = require_fallback2();
    }
  }
});

// node_modules/websocket/lib/WebSocketConnection.js
var require_WebSocketConnection = __commonJS({
  "node_modules/websocket/lib/WebSocketConnection.js"(exports, module2) {
    init_shims();
    var util = require("util");
    var utils = require_utils();
    var EventEmitter = require("events").EventEmitter;
    var WebSocketFrame = require_WebSocketFrame();
    var BufferList = require_FastBufferList();
    var isValidUTF8 = require_utf_8_validate();
    var bufferAllocUnsafe = utils.bufferAllocUnsafe;
    var bufferFromString = utils.bufferFromString;
    var STATE_OPEN = "open";
    var STATE_PEER_REQUESTED_CLOSE = "peer_requested_close";
    var STATE_ENDING = "ending";
    var STATE_CLOSED = "closed";
    var setImmediateImpl = "setImmediate" in global ? global.setImmediate.bind(global) : process.nextTick.bind(process);
    var idCounter = 0;
    function WebSocketConnection(socket, extensions, protocol, maskOutgoingPackets, config) {
      this._debug = utils.BufferingLogger("websocket:connection", ++idCounter);
      this._debug("constructor");
      if (this._debug.enabled) {
        instrumentSocketForDebugging(this, socket);
      }
      EventEmitter.call(this);
      this._pingListenerCount = 0;
      this.on("newListener", function(ev) {
        if (ev === "ping") {
          this._pingListenerCount++;
        }
      }).on("removeListener", function(ev) {
        if (ev === "ping") {
          this._pingListenerCount--;
        }
      });
      this.config = config;
      this.socket = socket;
      this.protocol = protocol;
      this.extensions = extensions;
      this.remoteAddress = socket.remoteAddress;
      this.closeReasonCode = -1;
      this.closeDescription = null;
      this.closeEventEmitted = false;
      this.maskOutgoingPackets = maskOutgoingPackets;
      this.maskBytes = bufferAllocUnsafe(4);
      this.frameHeader = bufferAllocUnsafe(10);
      this.bufferList = new BufferList();
      this.currentFrame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      this.fragmentationSize = 0;
      this.frameQueue = [];
      this.connected = true;
      this.state = STATE_OPEN;
      this.waitingForCloseResponse = false;
      this.receivedEnd = false;
      this.closeTimeout = this.config.closeTimeout;
      this.assembleFragments = this.config.assembleFragments;
      this.maxReceivedMessageSize = this.config.maxReceivedMessageSize;
      this.outputBufferFull = false;
      this.inputPaused = false;
      this.receivedDataHandler = this.processReceivedData.bind(this);
      this._closeTimerHandler = this.handleCloseTimer.bind(this);
      this.socket.setNoDelay(this.config.disableNagleAlgorithm);
      this.socket.setTimeout(0);
      if (this.config.keepalive && !this.config.useNativeKeepalive) {
        if (typeof this.config.keepaliveInterval !== "number") {
          throw new Error("keepaliveInterval must be specified and numeric if keepalive is true.");
        }
        this._keepaliveTimerHandler = this.handleKeepaliveTimer.bind(this);
        this.setKeepaliveTimer();
        if (this.config.dropConnectionOnKeepaliveTimeout) {
          if (typeof this.config.keepaliveGracePeriod !== "number") {
            throw new Error("keepaliveGracePeriod  must be specified and numeric if dropConnectionOnKeepaliveTimeout is true.");
          }
          this._gracePeriodTimerHandler = this.handleGracePeriodTimer.bind(this);
        }
      } else if (this.config.keepalive && this.config.useNativeKeepalive) {
        if (!("setKeepAlive" in this.socket)) {
          throw new Error("Unable to use native keepalive: unsupported by this version of Node.");
        }
        this.socket.setKeepAlive(true, this.config.keepaliveInterval);
      }
      this.socket.removeAllListeners("error");
    }
    WebSocketConnection.CLOSE_REASON_NORMAL = 1e3;
    WebSocketConnection.CLOSE_REASON_GOING_AWAY = 1001;
    WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR = 1002;
    WebSocketConnection.CLOSE_REASON_UNPROCESSABLE_INPUT = 1003;
    WebSocketConnection.CLOSE_REASON_RESERVED = 1004;
    WebSocketConnection.CLOSE_REASON_NOT_PROVIDED = 1005;
    WebSocketConnection.CLOSE_REASON_ABNORMAL = 1006;
    WebSocketConnection.CLOSE_REASON_INVALID_DATA = 1007;
    WebSocketConnection.CLOSE_REASON_POLICY_VIOLATION = 1008;
    WebSocketConnection.CLOSE_REASON_MESSAGE_TOO_BIG = 1009;
    WebSocketConnection.CLOSE_REASON_EXTENSION_REQUIRED = 1010;
    WebSocketConnection.CLOSE_REASON_INTERNAL_SERVER_ERROR = 1011;
    WebSocketConnection.CLOSE_REASON_TLS_HANDSHAKE_FAILED = 1015;
    WebSocketConnection.CLOSE_DESCRIPTIONS = {
      1e3: "Normal connection closure",
      1001: "Remote peer is going away",
      1002: "Protocol error",
      1003: "Unprocessable input",
      1004: "Reserved",
      1005: "Reason not provided",
      1006: "Abnormal closure, no further detail available",
      1007: "Invalid data received",
      1008: "Policy violation",
      1009: "Message too big",
      1010: "Extension requested by client is required",
      1011: "Internal Server Error",
      1015: "TLS Handshake Failed"
    };
    function validateCloseReason(code) {
      if (code < 1e3) {
        return false;
      }
      if (code >= 1e3 && code <= 2999) {
        return [1e3, 1001, 1002, 1003, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015].indexOf(code) !== -1;
      }
      if (code >= 3e3 && code <= 3999) {
        return true;
      }
      if (code >= 4e3 && code <= 4999) {
        return true;
      }
      if (code >= 5e3) {
        return false;
      }
    }
    util.inherits(WebSocketConnection, EventEmitter);
    WebSocketConnection.prototype._addSocketEventListeners = function() {
      this.socket.on("error", this.handleSocketError.bind(this));
      this.socket.on("end", this.handleSocketEnd.bind(this));
      this.socket.on("close", this.handleSocketClose.bind(this));
      this.socket.on("drain", this.handleSocketDrain.bind(this));
      this.socket.on("pause", this.handleSocketPause.bind(this));
      this.socket.on("resume", this.handleSocketResume.bind(this));
      this.socket.on("data", this.handleSocketData.bind(this));
    };
    WebSocketConnection.prototype.setKeepaliveTimer = function() {
      this._debug("setKeepaliveTimer");
      if (!this.config.keepalive || this.config.useNativeKeepalive) {
        return;
      }
      this.clearKeepaliveTimer();
      this.clearGracePeriodTimer();
      this._keepaliveTimeoutID = setTimeout(this._keepaliveTimerHandler, this.config.keepaliveInterval);
    };
    WebSocketConnection.prototype.clearKeepaliveTimer = function() {
      if (this._keepaliveTimeoutID) {
        clearTimeout(this._keepaliveTimeoutID);
      }
    };
    WebSocketConnection.prototype.handleKeepaliveTimer = function() {
      this._debug("handleKeepaliveTimer");
      this._keepaliveTimeoutID = null;
      this.ping();
      if (this.config.dropConnectionOnKeepaliveTimeout) {
        this.setGracePeriodTimer();
      } else {
        this.setKeepaliveTimer();
      }
    };
    WebSocketConnection.prototype.setGracePeriodTimer = function() {
      this._debug("setGracePeriodTimer");
      this.clearGracePeriodTimer();
      this._gracePeriodTimeoutID = setTimeout(this._gracePeriodTimerHandler, this.config.keepaliveGracePeriod);
    };
    WebSocketConnection.prototype.clearGracePeriodTimer = function() {
      if (this._gracePeriodTimeoutID) {
        clearTimeout(this._gracePeriodTimeoutID);
      }
    };
    WebSocketConnection.prototype.handleGracePeriodTimer = function() {
      this._debug("handleGracePeriodTimer");
      this._gracePeriodTimeoutID = null;
      this.drop(WebSocketConnection.CLOSE_REASON_ABNORMAL, "Peer not responding.", true);
    };
    WebSocketConnection.prototype.handleSocketData = function(data) {
      this._debug("handleSocketData");
      this.setKeepaliveTimer();
      this.bufferList.write(data);
      this.processReceivedData();
    };
    WebSocketConnection.prototype.processReceivedData = function() {
      this._debug("processReceivedData");
      if (!this.connected) {
        return;
      }
      if (this.inputPaused) {
        return;
      }
      var frame = this.currentFrame;
      if (!frame.addData(this.bufferList)) {
        this._debug("-- insufficient data for frame");
        return;
      }
      var self2 = this;
      if (frame.protocolError) {
        this._debug("-- protocol error");
        process.nextTick(function() {
          self2.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, frame.dropReason);
        });
        return;
      } else if (frame.frameTooLarge) {
        this._debug("-- frame too large");
        process.nextTick(function() {
          self2.drop(WebSocketConnection.CLOSE_REASON_MESSAGE_TOO_BIG, frame.dropReason);
        });
        return;
      }
      if (frame.rsv1 || frame.rsv2 || frame.rsv3) {
        this._debug("-- illegal rsv flag");
        process.nextTick(function() {
          self2.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, "Unsupported usage of rsv bits without negotiated extension.");
        });
        return;
      }
      if (!this.assembleFragments) {
        this._debug("-- emitting frame");
        process.nextTick(function() {
          self2.emit("frame", frame);
        });
      }
      process.nextTick(function() {
        self2.processFrame(frame);
      });
      this.currentFrame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      if (this.bufferList.length > 0) {
        setImmediateImpl(this.receivedDataHandler);
      }
    };
    WebSocketConnection.prototype.handleSocketError = function(error2) {
      this._debug("handleSocketError: %j", error2);
      if (this.state === STATE_CLOSED) {
        this._debug("  --- Socket 'error' after 'close'");
        return;
      }
      this.closeReasonCode = WebSocketConnection.CLOSE_REASON_ABNORMAL;
      this.closeDescription = "Socket Error: " + error2.syscall + " " + error2.code;
      this.connected = false;
      this.state = STATE_CLOSED;
      this.fragmentationSize = 0;
      if (utils.eventEmitterListenerCount(this, "error") > 0) {
        this.emit("error", error2);
      }
      this.socket.destroy();
      this._debug.printOutput();
    };
    WebSocketConnection.prototype.handleSocketEnd = function() {
      this._debug("handleSocketEnd: received socket end.  state = %s", this.state);
      this.receivedEnd = true;
      if (this.state === STATE_CLOSED) {
        this._debug("  --- Socket 'end' after 'close'");
        return;
      }
      if (this.state !== STATE_PEER_REQUESTED_CLOSE && this.state !== STATE_ENDING) {
        this._debug("  --- UNEXPECTED socket end.");
        this.socket.end();
      }
    };
    WebSocketConnection.prototype.handleSocketClose = function(hadError) {
      this._debug("handleSocketClose: received socket close");
      this.socketHadError = hadError;
      this.connected = false;
      this.state = STATE_CLOSED;
      if (this.closeReasonCode === -1) {
        this.closeReasonCode = WebSocketConnection.CLOSE_REASON_ABNORMAL;
        this.closeDescription = "Connection dropped by remote peer.";
      }
      this.clearCloseTimer();
      this.clearKeepaliveTimer();
      this.clearGracePeriodTimer();
      if (!this.closeEventEmitted) {
        this.closeEventEmitted = true;
        this._debug("-- Emitting WebSocketConnection close event");
        this.emit("close", this.closeReasonCode, this.closeDescription);
      }
    };
    WebSocketConnection.prototype.handleSocketDrain = function() {
      this._debug("handleSocketDrain: socket drain event");
      this.outputBufferFull = false;
      this.emit("drain");
    };
    WebSocketConnection.prototype.handleSocketPause = function() {
      this._debug("handleSocketPause: socket pause event");
      this.inputPaused = true;
      this.emit("pause");
    };
    WebSocketConnection.prototype.handleSocketResume = function() {
      this._debug("handleSocketResume: socket resume event");
      this.inputPaused = false;
      this.emit("resume");
      this.processReceivedData();
    };
    WebSocketConnection.prototype.pause = function() {
      this._debug("pause: pause requested");
      this.socket.pause();
    };
    WebSocketConnection.prototype.resume = function() {
      this._debug("resume: resume requested");
      this.socket.resume();
    };
    WebSocketConnection.prototype.close = function(reasonCode, description) {
      if (this.connected) {
        this._debug("close: Initating clean WebSocket close sequence.");
        if (typeof reasonCode !== "number") {
          reasonCode = WebSocketConnection.CLOSE_REASON_NORMAL;
        }
        if (!validateCloseReason(reasonCode)) {
          throw new Error("Close code " + reasonCode + " is not valid.");
        }
        if (typeof description !== "string") {
          description = WebSocketConnection.CLOSE_DESCRIPTIONS[reasonCode];
        }
        this.closeReasonCode = reasonCode;
        this.closeDescription = description;
        this.setCloseTimer();
        this.sendCloseFrame(this.closeReasonCode, this.closeDescription);
        this.state = STATE_ENDING;
        this.connected = false;
      }
    };
    WebSocketConnection.prototype.drop = function(reasonCode, description, skipCloseFrame) {
      this._debug("drop");
      if (typeof reasonCode !== "number") {
        reasonCode = WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR;
      }
      if (typeof description !== "string") {
        description = WebSocketConnection.CLOSE_DESCRIPTIONS[reasonCode];
      }
      this._debug("Forcefully dropping connection. skipCloseFrame: %s, code: %d, description: %s", skipCloseFrame, reasonCode, description);
      this.closeReasonCode = reasonCode;
      this.closeDescription = description;
      this.frameQueue = [];
      this.fragmentationSize = 0;
      if (!skipCloseFrame) {
        this.sendCloseFrame(reasonCode, description);
      }
      this.connected = false;
      this.state = STATE_CLOSED;
      this.clearCloseTimer();
      this.clearKeepaliveTimer();
      this.clearGracePeriodTimer();
      if (!this.closeEventEmitted) {
        this.closeEventEmitted = true;
        this._debug("Emitting WebSocketConnection close event");
        this.emit("close", this.closeReasonCode, this.closeDescription);
      }
      this._debug("Drop: destroying socket");
      this.socket.destroy();
    };
    WebSocketConnection.prototype.setCloseTimer = function() {
      this._debug("setCloseTimer");
      this.clearCloseTimer();
      this._debug("Setting close timer");
      this.waitingForCloseResponse = true;
      this.closeTimer = setTimeout(this._closeTimerHandler, this.closeTimeout);
    };
    WebSocketConnection.prototype.clearCloseTimer = function() {
      this._debug("clearCloseTimer");
      if (this.closeTimer) {
        this._debug("Clearing close timer");
        clearTimeout(this.closeTimer);
        this.waitingForCloseResponse = false;
        this.closeTimer = null;
      }
    };
    WebSocketConnection.prototype.handleCloseTimer = function() {
      this._debug("handleCloseTimer");
      this.closeTimer = null;
      if (this.waitingForCloseResponse) {
        this._debug("Close response not received from client.  Forcing socket end.");
        this.waitingForCloseResponse = false;
        this.state = STATE_CLOSED;
        this.socket.end();
      }
    };
    WebSocketConnection.prototype.processFrame = function(frame) {
      this._debug("processFrame");
      this._debug(" -- frame: %s", frame);
      if (this.frameQueue.length !== 0 && (frame.opcode > 0 && frame.opcode < 8)) {
        this.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, "Illegal frame opcode 0x" + frame.opcode.toString(16) + " received in middle of fragmented message.");
        return;
      }
      switch (frame.opcode) {
        case 2:
          this._debug("-- Binary Frame");
          if (this.assembleFragments) {
            if (frame.fin) {
              this._debug("---- Emitting 'message' event");
              this.emit("message", {
                type: "binary",
                binaryData: frame.binaryPayload
              });
            } else {
              this.frameQueue.push(frame);
              this.fragmentationSize = frame.length;
            }
          }
          break;
        case 1:
          this._debug("-- Text Frame");
          if (this.assembleFragments) {
            if (frame.fin) {
              if (!isValidUTF8(frame.binaryPayload)) {
                this.drop(WebSocketConnection.CLOSE_REASON_INVALID_DATA, "Invalid UTF-8 Data Received");
                return;
              }
              this._debug("---- Emitting 'message' event");
              this.emit("message", {
                type: "utf8",
                utf8Data: frame.binaryPayload.toString("utf8")
              });
            } else {
              this.frameQueue.push(frame);
              this.fragmentationSize = frame.length;
            }
          }
          break;
        case 0:
          this._debug("-- Continuation Frame");
          if (this.assembleFragments) {
            if (this.frameQueue.length === 0) {
              this.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, "Unexpected Continuation Frame");
              return;
            }
            this.fragmentationSize += frame.length;
            if (this.fragmentationSize > this.maxReceivedMessageSize) {
              this.drop(WebSocketConnection.CLOSE_REASON_MESSAGE_TOO_BIG, "Maximum message size exceeded.");
              return;
            }
            this.frameQueue.push(frame);
            if (frame.fin) {
              var bytesCopied = 0;
              var binaryPayload = bufferAllocUnsafe(this.fragmentationSize);
              var opcode = this.frameQueue[0].opcode;
              this.frameQueue.forEach(function(currentFrame) {
                currentFrame.binaryPayload.copy(binaryPayload, bytesCopied);
                bytesCopied += currentFrame.binaryPayload.length;
              });
              this.frameQueue = [];
              this.fragmentationSize = 0;
              switch (opcode) {
                case 2:
                  this.emit("message", {
                    type: "binary",
                    binaryData: binaryPayload
                  });
                  break;
                case 1:
                  if (!isValidUTF8(binaryPayload)) {
                    this.drop(WebSocketConnection.CLOSE_REASON_INVALID_DATA, "Invalid UTF-8 Data Received");
                    return;
                  }
                  this.emit("message", {
                    type: "utf8",
                    utf8Data: binaryPayload.toString("utf8")
                  });
                  break;
                default:
                  this.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, "Unexpected first opcode in fragmentation sequence: 0x" + opcode.toString(16));
                  return;
              }
            }
          }
          break;
        case 9:
          this._debug("-- Ping Frame");
          if (this._pingListenerCount > 0) {
            var cancelled = false;
            var cancel = function() {
              cancelled = true;
            };
            this.emit("ping", cancel, frame.binaryPayload);
            if (!cancelled) {
              this.pong(frame.binaryPayload);
            }
          } else {
            this.pong(frame.binaryPayload);
          }
          break;
        case 10:
          this._debug("-- Pong Frame");
          this.emit("pong", frame.binaryPayload);
          break;
        case 8:
          this._debug("-- Close Frame");
          if (this.waitingForCloseResponse) {
            this._debug("---- Got close response from peer.  Completing closing handshake.");
            this.clearCloseTimer();
            this.waitingForCloseResponse = false;
            this.state = STATE_CLOSED;
            this.socket.end();
            return;
          }
          this._debug("---- Closing handshake initiated by peer.");
          this.state = STATE_PEER_REQUESTED_CLOSE;
          var respondCloseReasonCode;
          if (frame.invalidCloseFrameLength) {
            this.closeReasonCode = 1005;
            respondCloseReasonCode = WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR;
          } else if (frame.closeStatus === -1 || validateCloseReason(frame.closeStatus)) {
            this.closeReasonCode = frame.closeStatus;
            respondCloseReasonCode = WebSocketConnection.CLOSE_REASON_NORMAL;
          } else {
            this.closeReasonCode = frame.closeStatus;
            respondCloseReasonCode = WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR;
          }
          if (frame.binaryPayload.length > 1) {
            if (!isValidUTF8(frame.binaryPayload)) {
              this.drop(WebSocketConnection.CLOSE_REASON_INVALID_DATA, "Invalid UTF-8 Data Received");
              return;
            }
            this.closeDescription = frame.binaryPayload.toString("utf8");
          } else {
            this.closeDescription = WebSocketConnection.CLOSE_DESCRIPTIONS[this.closeReasonCode];
          }
          this._debug("------ Remote peer %s - code: %d - %s - close frame payload length: %d", this.remoteAddress, this.closeReasonCode, this.closeDescription, frame.length);
          this._debug("------ responding to remote peer's close request.");
          this.sendCloseFrame(respondCloseReasonCode, null);
          this.connected = false;
          break;
        default:
          this._debug("-- Unrecognized Opcode %d", frame.opcode);
          this.drop(WebSocketConnection.CLOSE_REASON_PROTOCOL_ERROR, "Unrecognized Opcode: 0x" + frame.opcode.toString(16));
          break;
      }
    };
    WebSocketConnection.prototype.send = function(data, cb) {
      this._debug("send");
      if (Buffer.isBuffer(data)) {
        this.sendBytes(data, cb);
      } else if (typeof data["toString"] === "function") {
        this.sendUTF(data, cb);
      } else {
        throw new Error("Data provided must either be a Node Buffer or implement toString()");
      }
    };
    WebSocketConnection.prototype.sendUTF = function(data, cb) {
      data = bufferFromString(data.toString(), "utf8");
      this._debug("sendUTF: %d bytes", data.length);
      var frame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      frame.opcode = 1;
      frame.binaryPayload = data;
      this.fragmentAndSend(frame, cb);
    };
    WebSocketConnection.prototype.sendBytes = function(data, cb) {
      this._debug("sendBytes");
      if (!Buffer.isBuffer(data)) {
        throw new Error("You must pass a Node Buffer object to WebSocketConnection.prototype.sendBytes()");
      }
      var frame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      frame.opcode = 2;
      frame.binaryPayload = data;
      this.fragmentAndSend(frame, cb);
    };
    WebSocketConnection.prototype.ping = function(data) {
      this._debug("ping");
      var frame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      frame.opcode = 9;
      frame.fin = true;
      if (data) {
        if (!Buffer.isBuffer(data)) {
          data = bufferFromString(data.toString(), "utf8");
        }
        if (data.length > 125) {
          this._debug("WebSocket: Data for ping is longer than 125 bytes.  Truncating.");
          data = data.slice(0, 124);
        }
        frame.binaryPayload = data;
      }
      this.sendFrame(frame);
    };
    WebSocketConnection.prototype.pong = function(binaryPayload) {
      this._debug("pong");
      var frame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      frame.opcode = 10;
      if (Buffer.isBuffer(binaryPayload) && binaryPayload.length > 125) {
        this._debug("WebSocket: Data for pong is longer than 125 bytes.  Truncating.");
        binaryPayload = binaryPayload.slice(0, 124);
      }
      frame.binaryPayload = binaryPayload;
      frame.fin = true;
      this.sendFrame(frame);
    };
    WebSocketConnection.prototype.fragmentAndSend = function(frame, cb) {
      this._debug("fragmentAndSend");
      if (frame.opcode > 7) {
        throw new Error("You cannot fragment control frames.");
      }
      var threshold = this.config.fragmentationThreshold;
      var length = frame.binaryPayload.length;
      if (!this.config.fragmentOutgoingMessages || frame.binaryPayload && length <= threshold) {
        frame.fin = true;
        this.sendFrame(frame, cb);
        return;
      }
      var numFragments = Math.ceil(length / threshold);
      var sentFragments = 0;
      var sentCallback = function fragmentSentCallback(err) {
        if (err) {
          if (typeof cb === "function") {
            cb(err);
            cb = null;
          }
          return;
        }
        ++sentFragments;
        if (sentFragments === numFragments && typeof cb === "function") {
          cb();
        }
      };
      for (var i = 1; i <= numFragments; i++) {
        var currentFrame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
        currentFrame.opcode = i === 1 ? frame.opcode : 0;
        currentFrame.fin = i === numFragments;
        var currentLength = i === numFragments ? length - threshold * (i - 1) : threshold;
        var sliceStart = threshold * (i - 1);
        currentFrame.binaryPayload = frame.binaryPayload.slice(sliceStart, sliceStart + currentLength);
        this.sendFrame(currentFrame, sentCallback);
      }
    };
    WebSocketConnection.prototype.sendCloseFrame = function(reasonCode, description, cb) {
      if (typeof reasonCode !== "number") {
        reasonCode = WebSocketConnection.CLOSE_REASON_NORMAL;
      }
      this._debug("sendCloseFrame state: %s, reasonCode: %d, description: %s", this.state, reasonCode, description);
      if (this.state !== STATE_OPEN && this.state !== STATE_PEER_REQUESTED_CLOSE) {
        return;
      }
      var frame = new WebSocketFrame(this.maskBytes, this.frameHeader, this.config);
      frame.fin = true;
      frame.opcode = 8;
      frame.closeStatus = reasonCode;
      if (typeof description === "string") {
        frame.binaryPayload = bufferFromString(description, "utf8");
      }
      this.sendFrame(frame, cb);
      this.socket.end();
    };
    WebSocketConnection.prototype.sendFrame = function(frame, cb) {
      this._debug("sendFrame");
      frame.mask = this.maskOutgoingPackets;
      var flushed = this.socket.write(frame.toBuffer(), cb);
      this.outputBufferFull = !flushed;
      return flushed;
    };
    module2.exports = WebSocketConnection;
    function instrumentSocketForDebugging(connection, socket) {
      if (!connection._debug.enabled) {
        return;
      }
      var originalSocketEmit = socket.emit;
      socket.emit = function(event) {
        connection._debug("||| Socket Event  '%s'", event);
        originalSocketEmit.apply(this, arguments);
      };
      for (var key in socket) {
        if (typeof socket[key] !== "function") {
          continue;
        }
        if (["emit"].indexOf(key) !== -1) {
          continue;
        }
        (function(key2) {
          var original = socket[key2];
          if (key2 === "on") {
            socket[key2] = function proxyMethod__EventEmitter__On() {
              connection._debug("||| Socket method called:  %s (%s)", key2, arguments[0]);
              return original.apply(this, arguments);
            };
            return;
          }
          socket[key2] = function proxyMethod() {
            connection._debug("||| Socket method called:  %s", key2);
            return original.apply(this, arguments);
          };
        })(key);
      }
    }
  }
});

// node_modules/websocket/lib/WebSocketRequest.js
var require_WebSocketRequest = __commonJS({
  "node_modules/websocket/lib/WebSocketRequest.js"(exports, module2) {
    init_shims();
    var crypto = require("crypto");
    var util = require("util");
    var url = require("url");
    var EventEmitter = require("events").EventEmitter;
    var WebSocketConnection = require_WebSocketConnection();
    var headerValueSplitRegExp = /,\s*/;
    var headerParamSplitRegExp = /;\s*/;
    var headerSanitizeRegExp = /[\r\n]/g;
    var xForwardedForSeparatorRegExp = /,\s*/;
    var separators = [
      "(",
      ")",
      "<",
      ">",
      "@",
      ",",
      ";",
      ":",
      "\\",
      '"',
      "/",
      "[",
      "]",
      "?",
      "=",
      "{",
      "}",
      " ",
      String.fromCharCode(9)
    ];
    var controlChars = [String.fromCharCode(127)];
    for (i = 0; i < 31; i++) {
      controlChars.push(String.fromCharCode(i));
    }
    var i;
    var cookieNameValidateRegEx = /([\x00-\x20\x22\x28\x29\x2c\x2f\x3a-\x3f\x40\x5b-\x5e\x7b\x7d\x7f])/;
    var cookieValueValidateRegEx = /[^\x21\x23-\x2b\x2d-\x3a\x3c-\x5b\x5d-\x7e]/;
    var cookieValueDQuoteValidateRegEx = /^"[^"]*"$/;
    var controlCharsAndSemicolonRegEx = /[\x00-\x20\x3b]/g;
    var cookieSeparatorRegEx = /[;,] */;
    var httpStatusDescriptions = {
      100: "Continue",
      101: "Switching Protocols",
      200: "OK",
      201: "Created",
      203: "Non-Authoritative Information",
      204: "No Content",
      205: "Reset Content",
      206: "Partial Content",
      300: "Multiple Choices",
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      305: "Use Proxy",
      307: "Temporary Redirect",
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      406: "Not Acceptable",
      407: "Proxy Authorization Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Request Entity Too Long",
      414: "Request-URI Too Long",
      415: "Unsupported Media Type",
      416: "Requested Range Not Satisfiable",
      417: "Expectation Failed",
      426: "Upgrade Required",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported"
    };
    function WebSocketRequest(socket, httpRequest, serverConfig) {
      EventEmitter.call(this);
      this.socket = socket;
      this.httpRequest = httpRequest;
      this.resource = httpRequest.url;
      this.remoteAddress = socket.remoteAddress;
      this.remoteAddresses = [this.remoteAddress];
      this.serverConfig = serverConfig;
      this._socketIsClosing = false;
      this._socketCloseHandler = this._handleSocketCloseBeforeAccept.bind(this);
      this.socket.on("end", this._socketCloseHandler);
      this.socket.on("close", this._socketCloseHandler);
      this._resolved = false;
    }
    util.inherits(WebSocketRequest, EventEmitter);
    WebSocketRequest.prototype.readHandshake = function() {
      var self2 = this;
      var request = this.httpRequest;
      this.resourceURL = url.parse(this.resource, true);
      this.host = request.headers["host"];
      if (!this.host) {
        throw new Error("Client must provide a Host header.");
      }
      this.key = request.headers["sec-websocket-key"];
      if (!this.key) {
        throw new Error("Client must provide a value for Sec-WebSocket-Key.");
      }
      this.webSocketVersion = parseInt(request.headers["sec-websocket-version"], 10);
      if (!this.webSocketVersion || isNaN(this.webSocketVersion)) {
        throw new Error("Client must provide a value for Sec-WebSocket-Version.");
      }
      switch (this.webSocketVersion) {
        case 8:
        case 13:
          break;
        default:
          var e = new Error("Unsupported websocket client version: " + this.webSocketVersion + "Only versions 8 and 13 are supported.");
          e.httpCode = 426;
          e.headers = {
            "Sec-WebSocket-Version": "13"
          };
          throw e;
      }
      if (this.webSocketVersion === 13) {
        this.origin = request.headers["origin"];
      } else if (this.webSocketVersion === 8) {
        this.origin = request.headers["sec-websocket-origin"];
      }
      var protocolString = request.headers["sec-websocket-protocol"];
      this.protocolFullCaseMap = {};
      this.requestedProtocols = [];
      if (protocolString) {
        var requestedProtocolsFullCase = protocolString.split(headerValueSplitRegExp);
        requestedProtocolsFullCase.forEach(function(protocol) {
          var lcProtocol = protocol.toLocaleLowerCase();
          self2.requestedProtocols.push(lcProtocol);
          self2.protocolFullCaseMap[lcProtocol] = protocol;
        });
      }
      if (!this.serverConfig.ignoreXForwardedFor && request.headers["x-forwarded-for"]) {
        var immediatePeerIP = this.remoteAddress;
        this.remoteAddresses = request.headers["x-forwarded-for"].split(xForwardedForSeparatorRegExp);
        this.remoteAddresses.push(immediatePeerIP);
        this.remoteAddress = this.remoteAddresses[0];
      }
      if (this.serverConfig.parseExtensions) {
        var extensionsString = request.headers["sec-websocket-extensions"];
        this.requestedExtensions = this.parseExtensions(extensionsString);
      } else {
        this.requestedExtensions = [];
      }
      if (this.serverConfig.parseCookies) {
        var cookieString = request.headers["cookie"];
        this.cookies = this.parseCookies(cookieString);
      } else {
        this.cookies = [];
      }
    };
    WebSocketRequest.prototype.parseExtensions = function(extensionsString) {
      if (!extensionsString || extensionsString.length === 0) {
        return [];
      }
      var extensions = extensionsString.toLocaleLowerCase().split(headerValueSplitRegExp);
      extensions.forEach(function(extension, index2, array) {
        var params = extension.split(headerParamSplitRegExp);
        var extensionName = params[0];
        var extensionParams = params.slice(1);
        extensionParams.forEach(function(rawParam, index3, array2) {
          var arr = rawParam.split("=");
          var obj2 = {
            name: arr[0],
            value: arr[1]
          };
          array2.splice(index3, 1, obj2);
        });
        var obj = {
          name: extensionName,
          params: extensionParams
        };
        array.splice(index2, 1, obj);
      });
      return extensions;
    };
    WebSocketRequest.prototype.parseCookies = function(str) {
      if (!str || typeof str !== "string") {
        return [];
      }
      var cookies = [];
      var pairs = str.split(cookieSeparatorRegEx);
      pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf("=");
        if (eq_idx === -1) {
          cookies.push({
            name: pair,
            value: null
          });
          return;
        }
        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();
        if (val[0] === '"') {
          val = val.slice(1, -1);
        }
        cookies.push({
          name: key,
          value: decodeURIComponent(val)
        });
      });
      return cookies;
    };
    WebSocketRequest.prototype.accept = function(acceptedProtocol, allowedOrigin, cookies) {
      this._verifyResolution();
      var protocolFullCase;
      if (acceptedProtocol) {
        protocolFullCase = this.protocolFullCaseMap[acceptedProtocol.toLocaleLowerCase()];
        if (typeof protocolFullCase === "undefined") {
          protocolFullCase = acceptedProtocol;
        }
      } else {
        protocolFullCase = acceptedProtocol;
      }
      this.protocolFullCaseMap = null;
      var sha1 = crypto.createHash("sha1");
      sha1.update(this.key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
      var acceptKey = sha1.digest("base64");
      var response = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + acceptKey + "\r\n";
      if (protocolFullCase) {
        for (var i2 = 0; i2 < protocolFullCase.length; i2++) {
          var charCode = protocolFullCase.charCodeAt(i2);
          var character = protocolFullCase.charAt(i2);
          if (charCode < 33 || charCode > 126 || separators.indexOf(character) !== -1) {
            this.reject(500);
            throw new Error('Illegal character "' + String.fromCharCode(character) + '" in subprotocol.');
          }
        }
        if (this.requestedProtocols.indexOf(acceptedProtocol) === -1) {
          this.reject(500);
          throw new Error("Specified protocol was not requested by the client.");
        }
        protocolFullCase = protocolFullCase.replace(headerSanitizeRegExp, "");
        response += "Sec-WebSocket-Protocol: " + protocolFullCase + "\r\n";
      }
      this.requestedProtocols = null;
      if (allowedOrigin) {
        allowedOrigin = allowedOrigin.replace(headerSanitizeRegExp, "");
        if (this.webSocketVersion === 13) {
          response += "Origin: " + allowedOrigin + "\r\n";
        } else if (this.webSocketVersion === 8) {
          response += "Sec-WebSocket-Origin: " + allowedOrigin + "\r\n";
        }
      }
      if (cookies) {
        if (!Array.isArray(cookies)) {
          this.reject(500);
          throw new Error('Value supplied for "cookies" argument must be an array.');
        }
        var seenCookies = {};
        cookies.forEach(function(cookie) {
          if (!cookie.name || !cookie.value) {
            this.reject(500);
            throw new Error('Each cookie to set must at least provide a "name" and "value"');
          }
          cookie.name = cookie.name.replace(controlCharsAndSemicolonRegEx, "");
          cookie.value = cookie.value.replace(controlCharsAndSemicolonRegEx, "");
          if (seenCookies[cookie.name]) {
            this.reject(500);
            throw new Error("You may not specify the same cookie name twice.");
          }
          seenCookies[cookie.name] = true;
          var invalidChar = cookie.name.match(cookieNameValidateRegEx);
          if (invalidChar) {
            this.reject(500);
            throw new Error("Illegal character " + invalidChar[0] + " in cookie name");
          }
          if (cookie.value.match(cookieValueDQuoteValidateRegEx)) {
            invalidChar = cookie.value.slice(1, -1).match(cookieValueValidateRegEx);
          } else {
            invalidChar = cookie.value.match(cookieValueValidateRegEx);
          }
          if (invalidChar) {
            this.reject(500);
            throw new Error("Illegal character " + invalidChar[0] + " in cookie value");
          }
          var cookieParts = [cookie.name + "=" + cookie.value];
          if (cookie.path) {
            invalidChar = cookie.path.match(controlCharsAndSemicolonRegEx);
            if (invalidChar) {
              this.reject(500);
              throw new Error("Illegal character " + invalidChar[0] + " in cookie path");
            }
            cookieParts.push("Path=" + cookie.path);
          }
          if (cookie.domain) {
            if (typeof cookie.domain !== "string") {
              this.reject(500);
              throw new Error("Domain must be specified and must be a string.");
            }
            invalidChar = cookie.domain.match(controlCharsAndSemicolonRegEx);
            if (invalidChar) {
              this.reject(500);
              throw new Error("Illegal character " + invalidChar[0] + " in cookie domain");
            }
            cookieParts.push("Domain=" + cookie.domain.toLowerCase());
          }
          if (cookie.expires) {
            if (!(cookie.expires instanceof Date)) {
              this.reject(500);
              throw new Error('Value supplied for cookie "expires" must be a vaild date object');
            }
            cookieParts.push("Expires=" + cookie.expires.toGMTString());
          }
          if (cookie.maxage) {
            var maxage = cookie.maxage;
            if (typeof maxage === "string") {
              maxage = parseInt(maxage, 10);
            }
            if (isNaN(maxage) || maxage <= 0) {
              this.reject(500);
              throw new Error('Value supplied for cookie "maxage" must be a non-zero number');
            }
            maxage = Math.round(maxage);
            cookieParts.push("Max-Age=" + maxage.toString(10));
          }
          if (cookie.secure) {
            if (typeof cookie.secure !== "boolean") {
              this.reject(500);
              throw new Error('Value supplied for cookie "secure" must be of type boolean');
            }
            cookieParts.push("Secure");
          }
          if (cookie.httponly) {
            if (typeof cookie.httponly !== "boolean") {
              this.reject(500);
              throw new Error('Value supplied for cookie "httponly" must be of type boolean');
            }
            cookieParts.push("HttpOnly");
          }
          response += "Set-Cookie: " + cookieParts.join(";") + "\r\n";
        }.bind(this));
      }
      this._resolved = true;
      this.emit("requestResolved", this);
      response += "\r\n";
      var connection = new WebSocketConnection(this.socket, [], acceptedProtocol, false, this.serverConfig);
      connection.webSocketVersion = this.webSocketVersion;
      connection.remoteAddress = this.remoteAddress;
      connection.remoteAddresses = this.remoteAddresses;
      var self2 = this;
      if (this._socketIsClosing) {
        cleanupFailedConnection(connection);
      } else {
        this.socket.write(response, "ascii", function(error2) {
          if (error2) {
            cleanupFailedConnection(connection);
            return;
          }
          self2._removeSocketCloseListeners();
          connection._addSocketEventListeners();
        });
      }
      this.emit("requestAccepted", connection);
      return connection;
    };
    WebSocketRequest.prototype.reject = function(status, reason, extraHeaders) {
      this._verifyResolution();
      this._resolved = true;
      this.emit("requestResolved", this);
      if (typeof status !== "number") {
        status = 403;
      }
      var response = "HTTP/1.1 " + status + " " + httpStatusDescriptions[status] + "\r\nConnection: close\r\n";
      if (reason) {
        reason = reason.replace(headerSanitizeRegExp, "");
        response += "X-WebSocket-Reject-Reason: " + reason + "\r\n";
      }
      if (extraHeaders) {
        for (var key in extraHeaders) {
          var sanitizedValue = extraHeaders[key].toString().replace(headerSanitizeRegExp, "");
          var sanitizedKey = key.replace(headerSanitizeRegExp, "");
          response += sanitizedKey + ": " + sanitizedValue + "\r\n";
        }
      }
      response += "\r\n";
      this.socket.end(response, "ascii");
      this.emit("requestRejected", this);
    };
    WebSocketRequest.prototype._handleSocketCloseBeforeAccept = function() {
      this._socketIsClosing = true;
      this._removeSocketCloseListeners();
    };
    WebSocketRequest.prototype._removeSocketCloseListeners = function() {
      this.socket.removeListener("end", this._socketCloseHandler);
      this.socket.removeListener("close", this._socketCloseHandler);
    };
    WebSocketRequest.prototype._verifyResolution = function() {
      if (this._resolved) {
        throw new Error("WebSocketRequest may only be accepted or rejected one time.");
      }
    };
    function cleanupFailedConnection(connection) {
      process.nextTick(function() {
        connection.drop(1006, "TCP connection lost before handshake completed.", true);
      });
    }
    module2.exports = WebSocketRequest;
  }
});

// node_modules/websocket/lib/WebSocketServer.js
var require_WebSocketServer = __commonJS({
  "node_modules/websocket/lib/WebSocketServer.js"(exports, module2) {
    init_shims();
    var extend = require_utils().extend;
    var utils = require_utils();
    var util = require("util");
    var debug = require_src()("websocket:server");
    var EventEmitter = require("events").EventEmitter;
    var WebSocketRequest = require_WebSocketRequest();
    var WebSocketServer = function WebSocketServer2(config) {
      EventEmitter.call(this);
      this._handlers = {
        upgrade: this.handleUpgrade.bind(this),
        requestAccepted: this.handleRequestAccepted.bind(this),
        requestResolved: this.handleRequestResolved.bind(this)
      };
      this.connections = [];
      this.pendingRequests = [];
      if (config) {
        this.mount(config);
      }
    };
    util.inherits(WebSocketServer, EventEmitter);
    WebSocketServer.prototype.mount = function(config) {
      this.config = {
        httpServer: null,
        maxReceivedFrameSize: 65536,
        maxReceivedMessageSize: 1048576,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 16384,
        keepalive: true,
        keepaliveInterval: 2e4,
        dropConnectionOnKeepaliveTimeout: true,
        keepaliveGracePeriod: 1e4,
        useNativeKeepalive: false,
        assembleFragments: true,
        autoAcceptConnections: false,
        ignoreXForwardedFor: false,
        parseCookies: true,
        parseExtensions: true,
        disableNagleAlgorithm: true,
        closeTimeout: 5e3
      };
      extend(this.config, config);
      if (this.config.httpServer) {
        if (!Array.isArray(this.config.httpServer)) {
          this.config.httpServer = [this.config.httpServer];
        }
        var upgradeHandler = this._handlers.upgrade;
        this.config.httpServer.forEach(function(httpServer) {
          httpServer.on("upgrade", upgradeHandler);
        });
      } else {
        throw new Error("You must specify an httpServer on which to mount the WebSocket server.");
      }
    };
    WebSocketServer.prototype.unmount = function() {
      var upgradeHandler = this._handlers.upgrade;
      this.config.httpServer.forEach(function(httpServer) {
        httpServer.removeListener("upgrade", upgradeHandler);
      });
    };
    WebSocketServer.prototype.closeAllConnections = function() {
      this.connections.forEach(function(connection) {
        connection.close();
      });
      this.pendingRequests.forEach(function(request) {
        process.nextTick(function() {
          request.reject(503);
        });
      });
    };
    WebSocketServer.prototype.broadcast = function(data) {
      if (Buffer.isBuffer(data)) {
        this.broadcastBytes(data);
      } else if (typeof data.toString === "function") {
        this.broadcastUTF(data);
      }
    };
    WebSocketServer.prototype.broadcastUTF = function(utfData) {
      this.connections.forEach(function(connection) {
        connection.sendUTF(utfData);
      });
    };
    WebSocketServer.prototype.broadcastBytes = function(binaryData) {
      this.connections.forEach(function(connection) {
        connection.sendBytes(binaryData);
      });
    };
    WebSocketServer.prototype.shutDown = function() {
      this.unmount();
      this.closeAllConnections();
    };
    WebSocketServer.prototype.handleUpgrade = function(request, socket) {
      var self2 = this;
      var wsRequest = new WebSocketRequest(socket, request, this.config);
      try {
        wsRequest.readHandshake();
      } catch (e) {
        wsRequest.reject(e.httpCode ? e.httpCode : 400, e.message, e.headers);
        debug("Invalid handshake: %s", e.message);
        this.emit("upgradeError", e);
        return;
      }
      this.pendingRequests.push(wsRequest);
      wsRequest.once("requestAccepted", this._handlers.requestAccepted);
      wsRequest.once("requestResolved", this._handlers.requestResolved);
      socket.once("close", function() {
        self2._handlers.requestResolved(wsRequest);
      });
      if (!this.config.autoAcceptConnections && utils.eventEmitterListenerCount(this, "request") > 0) {
        this.emit("request", wsRequest);
      } else if (this.config.autoAcceptConnections) {
        wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
      } else {
        wsRequest.reject(404, "No handler is configured to accept the connection.");
      }
    };
    WebSocketServer.prototype.handleRequestAccepted = function(connection) {
      var self2 = this;
      connection.once("close", function(closeReason, description) {
        self2.handleConnectionClose(connection, closeReason, description);
      });
      this.connections.push(connection);
      this.emit("connect", connection);
    };
    WebSocketServer.prototype.handleConnectionClose = function(connection, closeReason, description) {
      var index2 = this.connections.indexOf(connection);
      if (index2 !== -1) {
        this.connections.splice(index2, 1);
      }
      this.emit("close", connection, closeReason, description);
    };
    WebSocketServer.prototype.handleRequestResolved = function(request) {
      var index2 = this.pendingRequests.indexOf(request);
      if (index2 !== -1) {
        this.pendingRequests.splice(index2, 1);
      }
    };
    module2.exports = WebSocketServer;
  }
});

// node_modules/websocket/lib/WebSocketClient.js
var require_WebSocketClient = __commonJS({
  "node_modules/websocket/lib/WebSocketClient.js"(exports, module2) {
    init_shims();
    var utils = require_utils();
    var extend = utils.extend;
    var util = require("util");
    var EventEmitter = require("events").EventEmitter;
    var http2 = require("http");
    var https2 = require("https");
    var url = require("url");
    var crypto = require("crypto");
    var WebSocketConnection = require_WebSocketConnection();
    var bufferAllocUnsafe = utils.bufferAllocUnsafe;
    var protocolSeparators = [
      "(",
      ")",
      "<",
      ">",
      "@",
      ",",
      ";",
      ":",
      "\\",
      '"',
      "/",
      "[",
      "]",
      "?",
      "=",
      "{",
      "}",
      " ",
      String.fromCharCode(9)
    ];
    var excludedTlsOptions = ["hostname", "port", "method", "path", "headers"];
    function WebSocketClient(config) {
      EventEmitter.call(this);
      this.config = {
        maxReceivedFrameSize: 1048576,
        maxReceivedMessageSize: 8388608,
        fragmentOutgoingMessages: true,
        fragmentationThreshold: 16384,
        webSocketVersion: 13,
        assembleFragments: true,
        disableNagleAlgorithm: true,
        closeTimeout: 5e3,
        tlsOptions: {}
      };
      if (config) {
        var tlsOptions;
        if (config.tlsOptions) {
          tlsOptions = config.tlsOptions;
          delete config.tlsOptions;
        } else {
          tlsOptions = {};
        }
        extend(this.config, config);
        extend(this.config.tlsOptions, tlsOptions);
      }
      this._req = null;
      switch (this.config.webSocketVersion) {
        case 8:
        case 13:
          break;
        default:
          throw new Error("Requested webSocketVersion is not supported. Allowed values are 8 and 13.");
      }
    }
    util.inherits(WebSocketClient, EventEmitter);
    WebSocketClient.prototype.connect = function(requestUrl, protocols, origin, headers, extraRequestOptions) {
      var self2 = this;
      if (typeof protocols === "string") {
        if (protocols.length > 0) {
          protocols = [protocols];
        } else {
          protocols = [];
        }
      }
      if (!(protocols instanceof Array)) {
        protocols = [];
      }
      this.protocols = protocols;
      this.origin = origin;
      if (typeof requestUrl === "string") {
        this.url = url.parse(requestUrl);
      } else {
        this.url = requestUrl;
      }
      if (!this.url.protocol) {
        throw new Error("You must specify a full WebSocket URL, including protocol.");
      }
      if (!this.url.host) {
        throw new Error("You must specify a full WebSocket URL, including hostname. Relative URLs are not supported.");
      }
      this.secure = this.url.protocol === "wss:";
      this.protocols.forEach(function(protocol) {
        for (var i2 = 0; i2 < protocol.length; i2++) {
          var charCode = protocol.charCodeAt(i2);
          var character = protocol.charAt(i2);
          if (charCode < 33 || charCode > 126 || protocolSeparators.indexOf(character) !== -1) {
            throw new Error('Protocol list contains invalid character "' + String.fromCharCode(charCode) + '"');
          }
        }
      });
      var defaultPorts = {
        "ws:": "80",
        "wss:": "443"
      };
      if (!this.url.port) {
        this.url.port = defaultPorts[this.url.protocol];
      }
      var nonce = bufferAllocUnsafe(16);
      for (var i = 0; i < 16; i++) {
        nonce[i] = Math.round(Math.random() * 255);
      }
      this.base64nonce = nonce.toString("base64");
      var hostHeaderValue = this.url.hostname;
      if (this.url.protocol === "ws:" && this.url.port !== "80" || this.url.protocol === "wss:" && this.url.port !== "443") {
        hostHeaderValue += ":" + this.url.port;
      }
      var reqHeaders = {};
      if (this.secure && this.config.tlsOptions.hasOwnProperty("headers")) {
        extend(reqHeaders, this.config.tlsOptions.headers);
      }
      if (headers) {
        extend(reqHeaders, headers);
      }
      extend(reqHeaders, {
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Version": this.config.webSocketVersion.toString(10),
        "Sec-WebSocket-Key": this.base64nonce,
        "Host": reqHeaders.Host || hostHeaderValue
      });
      if (this.protocols.length > 0) {
        reqHeaders["Sec-WebSocket-Protocol"] = this.protocols.join(", ");
      }
      if (this.origin) {
        if (this.config.webSocketVersion === 13) {
          reqHeaders["Origin"] = this.origin;
        } else if (this.config.webSocketVersion === 8) {
          reqHeaders["Sec-WebSocket-Origin"] = this.origin;
        }
      }
      var pathAndQuery;
      if (this.url.pathname) {
        pathAndQuery = this.url.path;
      } else if (this.url.path) {
        pathAndQuery = "/" + this.url.path;
      } else {
        pathAndQuery = "/";
      }
      function handleRequestError(error2) {
        self2._req = null;
        self2.emit("connectFailed", error2);
      }
      var requestOptions = {
        agent: false
      };
      if (extraRequestOptions) {
        extend(requestOptions, extraRequestOptions);
      }
      extend(requestOptions, {
        hostname: this.url.hostname,
        port: this.url.port,
        method: "GET",
        path: pathAndQuery,
        headers: reqHeaders
      });
      if (this.secure) {
        var tlsOptions = this.config.tlsOptions;
        for (var key in tlsOptions) {
          if (tlsOptions.hasOwnProperty(key) && excludedTlsOptions.indexOf(key) === -1) {
            requestOptions[key] = tlsOptions[key];
          }
        }
      }
      var req = this._req = (this.secure ? https2 : http2).request(requestOptions);
      req.on("upgrade", function handleRequestUpgrade(response, socket, head) {
        self2._req = null;
        req.removeListener("error", handleRequestError);
        self2.socket = socket;
        self2.response = response;
        self2.firstDataChunk = head;
        self2.validateHandshake();
      });
      req.on("error", handleRequestError);
      req.on("response", function(response) {
        self2._req = null;
        if (utils.eventEmitterListenerCount(self2, "httpResponse") > 0) {
          self2.emit("httpResponse", response, self2);
          if (response.socket) {
            response.socket.end();
          }
        } else {
          var headerDumpParts = [];
          for (var headerName in response.headers) {
            headerDumpParts.push(headerName + ": " + response.headers[headerName]);
          }
          self2.failHandshake("Server responded with a non-101 status: " + response.statusCode + " " + response.statusMessage + "\nResponse Headers Follow:\n" + headerDumpParts.join("\n") + "\n");
        }
      });
      req.end();
    };
    WebSocketClient.prototype.validateHandshake = function() {
      var headers = this.response.headers;
      if (this.protocols.length > 0) {
        this.protocol = headers["sec-websocket-protocol"];
        if (this.protocol) {
          if (this.protocols.indexOf(this.protocol) === -1) {
            this.failHandshake("Server did not respond with a requested protocol.");
            return;
          }
        } else {
          this.failHandshake("Expected a Sec-WebSocket-Protocol header.");
          return;
        }
      }
      if (!(headers["connection"] && headers["connection"].toLocaleLowerCase() === "upgrade")) {
        this.failHandshake("Expected a Connection: Upgrade header from the server");
        return;
      }
      if (!(headers["upgrade"] && headers["upgrade"].toLocaleLowerCase() === "websocket")) {
        this.failHandshake("Expected an Upgrade: websocket header from the server");
        return;
      }
      var sha1 = crypto.createHash("sha1");
      sha1.update(this.base64nonce + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
      var expectedKey = sha1.digest("base64");
      if (!headers["sec-websocket-accept"]) {
        this.failHandshake("Expected Sec-WebSocket-Accept header from server");
        return;
      }
      if (headers["sec-websocket-accept"] !== expectedKey) {
        this.failHandshake("Sec-WebSocket-Accept header from server didn't match expected value of " + expectedKey);
        return;
      }
      this.succeedHandshake();
    };
    WebSocketClient.prototype.failHandshake = function(errorDescription) {
      if (this.socket && this.socket.writable) {
        this.socket.end();
      }
      this.emit("connectFailed", new Error(errorDescription));
    };
    WebSocketClient.prototype.succeedHandshake = function() {
      var connection = new WebSocketConnection(this.socket, [], this.protocol, true, this.config);
      connection.webSocketVersion = this.config.webSocketVersion;
      connection._addSocketEventListeners();
      this.emit("connect", connection);
      if (this.firstDataChunk.length > 0) {
        connection.handleSocketData(this.firstDataChunk);
      }
      this.firstDataChunk = null;
    };
    WebSocketClient.prototype.abort = function() {
      if (this._req) {
        this._req.abort();
      }
    };
    module2.exports = WebSocketClient;
  }
});

// node_modules/websocket/lib/WebSocketRouterRequest.js
var require_WebSocketRouterRequest = __commonJS({
  "node_modules/websocket/lib/WebSocketRouterRequest.js"(exports, module2) {
    init_shims();
    var util = require("util");
    var EventEmitter = require("events").EventEmitter;
    function WebSocketRouterRequest(webSocketRequest, resolvedProtocol) {
      EventEmitter.call(this);
      this.webSocketRequest = webSocketRequest;
      if (resolvedProtocol === "____no_protocol____") {
        this.protocol = null;
      } else {
        this.protocol = resolvedProtocol;
      }
      this.origin = webSocketRequest.origin;
      this.resource = webSocketRequest.resource;
      this.resourceURL = webSocketRequest.resourceURL;
      this.httpRequest = webSocketRequest.httpRequest;
      this.remoteAddress = webSocketRequest.remoteAddress;
      this.webSocketVersion = webSocketRequest.webSocketVersion;
      this.requestedExtensions = webSocketRequest.requestedExtensions;
      this.cookies = webSocketRequest.cookies;
    }
    util.inherits(WebSocketRouterRequest, EventEmitter);
    WebSocketRouterRequest.prototype.accept = function(origin, cookies) {
      var connection = this.webSocketRequest.accept(this.protocol, origin, cookies);
      this.emit("requestAccepted", connection);
      return connection;
    };
    WebSocketRouterRequest.prototype.reject = function(status, reason, extraHeaders) {
      this.webSocketRequest.reject(status, reason, extraHeaders);
      this.emit("requestRejected", this);
    };
    module2.exports = WebSocketRouterRequest;
  }
});

// node_modules/websocket/lib/WebSocketRouter.js
var require_WebSocketRouter = __commonJS({
  "node_modules/websocket/lib/WebSocketRouter.js"(exports, module2) {
    init_shims();
    var extend = require_utils().extend;
    var util = require("util");
    var EventEmitter = require("events").EventEmitter;
    var WebSocketRouterRequest = require_WebSocketRouterRequest();
    function WebSocketRouter(config) {
      EventEmitter.call(this);
      this.config = {
        server: null
      };
      if (config) {
        extend(this.config, config);
      }
      this.handlers = [];
      this._requestHandler = this.handleRequest.bind(this);
      if (this.config.server) {
        this.attachServer(this.config.server);
      }
    }
    util.inherits(WebSocketRouter, EventEmitter);
    WebSocketRouter.prototype.attachServer = function(server) {
      if (server) {
        this.server = server;
        this.server.on("request", this._requestHandler);
      } else {
        throw new Error("You must specify a WebSocketServer instance to attach to.");
      }
    };
    WebSocketRouter.prototype.detachServer = function() {
      if (this.server) {
        this.server.removeListener("request", this._requestHandler);
        this.server = null;
      } else {
        throw new Error("Cannot detach from server: not attached.");
      }
    };
    WebSocketRouter.prototype.mount = function(path, protocol, callback) {
      if (!path) {
        throw new Error("You must specify a path for this handler.");
      }
      if (!protocol) {
        protocol = "____no_protocol____";
      }
      if (!callback) {
        throw new Error("You must specify a callback for this handler.");
      }
      path = this.pathToRegExp(path);
      if (!(path instanceof RegExp)) {
        throw new Error("Path must be specified as either a string or a RegExp.");
      }
      var pathString = path.toString();
      protocol = protocol.toLocaleLowerCase();
      if (this.findHandlerIndex(pathString, protocol) !== -1) {
        throw new Error("You may only mount one handler per path/protocol combination.");
      }
      this.handlers.push({
        "path": path,
        "pathString": pathString,
        "protocol": protocol,
        "callback": callback
      });
    };
    WebSocketRouter.prototype.unmount = function(path, protocol) {
      var index2 = this.findHandlerIndex(this.pathToRegExp(path).toString(), protocol);
      if (index2 !== -1) {
        this.handlers.splice(index2, 1);
      } else {
        throw new Error("Unable to find a route matching the specified path and protocol.");
      }
    };
    WebSocketRouter.prototype.findHandlerIndex = function(pathString, protocol) {
      protocol = protocol.toLocaleLowerCase();
      for (var i = 0, len = this.handlers.length; i < len; i++) {
        var handler = this.handlers[i];
        if (handler.pathString === pathString && handler.protocol === protocol) {
          return i;
        }
      }
      return -1;
    };
    WebSocketRouter.prototype.pathToRegExp = function(path) {
      if (typeof path === "string") {
        if (path === "*") {
          path = /^.*$/;
        } else {
          path = path.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          path = new RegExp("^" + path + "$");
        }
      }
      return path;
    };
    WebSocketRouter.prototype.handleRequest = function(request) {
      var requestedProtocols = request.requestedProtocols;
      if (requestedProtocols.length === 0) {
        requestedProtocols = ["____no_protocol____"];
      }
      for (var i = 0; i < requestedProtocols.length; i++) {
        var requestedProtocol = requestedProtocols[i].toLocaleLowerCase();
        for (var j = 0, len = this.handlers.length; j < len; j++) {
          var handler = this.handlers[j];
          if (handler.path.test(request.resourceURL.pathname)) {
            if (requestedProtocol === handler.protocol || handler.protocol === "*") {
              var routerRequest = new WebSocketRouterRequest(request, requestedProtocol);
              handler.callback(routerRequest);
              return;
            }
          }
        }
      }
      request.reject(404, "No handler is available for the given request.");
    };
    module2.exports = WebSocketRouter;
  }
});

// node_modules/is-typedarray/index.js
var require_is_typedarray = __commonJS({
  "node_modules/is-typedarray/index.js"(exports, module2) {
    init_shims();
    module2.exports = isTypedArray;
    isTypedArray.strict = isStrictTypedArray;
    isTypedArray.loose = isLooseTypedArray;
    var toString = Object.prototype.toString;
    var names = {
      "[object Int8Array]": true,
      "[object Int16Array]": true,
      "[object Int32Array]": true,
      "[object Uint8Array]": true,
      "[object Uint8ClampedArray]": true,
      "[object Uint16Array]": true,
      "[object Uint32Array]": true,
      "[object Float32Array]": true,
      "[object Float64Array]": true
    };
    function isTypedArray(arr) {
      return isStrictTypedArray(arr) || isLooseTypedArray(arr);
    }
    function isStrictTypedArray(arr) {
      return arr instanceof Int8Array || arr instanceof Int16Array || arr instanceof Int32Array || arr instanceof Uint8Array || arr instanceof Uint8ClampedArray || arr instanceof Uint16Array || arr instanceof Uint32Array || arr instanceof Float32Array || arr instanceof Float64Array;
    }
    function isLooseTypedArray(arr) {
      return names[toString.call(arr)];
    }
  }
});

// node_modules/typedarray-to-buffer/index.js
var require_typedarray_to_buffer = __commonJS({
  "node_modules/typedarray-to-buffer/index.js"(exports, module2) {
    init_shims();
    var isTypedArray = require_is_typedarray().strict;
    module2.exports = function typedarrayToBuffer(arr) {
      if (isTypedArray(arr)) {
        var buf = Buffer.from(arr.buffer);
        if (arr.byteLength !== arr.buffer.byteLength) {
          buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
        }
        return buf;
      } else {
        return Buffer.from(arr);
      }
    };
  }
});

// node_modules/yaeti/lib/EventTarget.js
var require_EventTarget = __commonJS({
  "node_modules/yaeti/lib/EventTarget.js"(exports, module2) {
    init_shims();
    module2.exports = _EventTarget;
    function _EventTarget() {
      if (typeof this.addEventListener === "function") {
        return;
      }
      this._listeners = {};
      this.addEventListener = _addEventListener;
      this.removeEventListener = _removeEventListener;
      this.dispatchEvent = _dispatchEvent;
    }
    Object.defineProperties(_EventTarget.prototype, {
      listeners: {
        get: function() {
          return this._listeners;
        }
      }
    });
    function _addEventListener(type, newListener) {
      var listenersType, i, listener;
      if (!type || !newListener) {
        return;
      }
      listenersType = this._listeners[type];
      if (listenersType === void 0) {
        this._listeners[type] = listenersType = [];
      }
      for (i = 0; !!(listener = listenersType[i]); i++) {
        if (listener === newListener) {
          return;
        }
      }
      listenersType.push(newListener);
    }
    function _removeEventListener(type, oldListener) {
      var listenersType, i, listener;
      if (!type || !oldListener) {
        return;
      }
      listenersType = this._listeners[type];
      if (listenersType === void 0) {
        return;
      }
      for (i = 0; !!(listener = listenersType[i]); i++) {
        if (listener === oldListener) {
          listenersType.splice(i, 1);
          break;
        }
      }
      if (listenersType.length === 0) {
        delete this._listeners[type];
      }
    }
    function _dispatchEvent(event) {
      var type, listenersType, dummyListener, stopImmediatePropagation = false, i, listener;
      if (!event || typeof event.type !== "string") {
        throw new Error("`event` must have a valid `type` property");
      }
      if (event._yaeti) {
        event.target = this;
        event.cancelable = true;
      }
      try {
        event.stopImmediatePropagation = function() {
          stopImmediatePropagation = true;
        };
      } catch (error2) {
      }
      type = event.type;
      listenersType = this._listeners[type] || [];
      dummyListener = this["on" + type];
      if (typeof dummyListener === "function") {
        dummyListener.call(this, event);
      }
      for (i = 0; !!(listener = listenersType[i]); i++) {
        if (stopImmediatePropagation) {
          break;
        }
        listener.call(this, event);
      }
      return !event.defaultPrevented;
    }
  }
});

// node_modules/yaeti/lib/Event.js
var require_Event = __commonJS({
  "node_modules/yaeti/lib/Event.js"(exports, module2) {
    init_shims();
    module2.exports = _Event;
    function _Event(type) {
      this.type = type;
      this.isTrusted = false;
      this._yaeti = true;
    }
  }
});

// node_modules/yaeti/index.js
var require_yaeti = __commonJS({
  "node_modules/yaeti/index.js"(exports, module2) {
    init_shims();
    module2.exports = {
      EventTarget: require_EventTarget(),
      Event: require_Event()
    };
  }
});

// node_modules/websocket/lib/W3CWebSocket.js
var require_W3CWebSocket = __commonJS({
  "node_modules/websocket/lib/W3CWebSocket.js"(exports, module2) {
    init_shims();
    var WebSocketClient = require_WebSocketClient();
    var toBuffer = require_typedarray_to_buffer();
    var yaeti = require_yaeti();
    var CONNECTING = 0;
    var OPEN = 1;
    var CLOSING = 2;
    var CLOSED = 3;
    module2.exports = W3CWebSocket;
    function W3CWebSocket(url, protocols, origin, headers, requestOptions, clientConfig) {
      yaeti.EventTarget.call(this);
      clientConfig = clientConfig || {};
      clientConfig.assembleFragments = true;
      var self2 = this;
      this._url = url;
      this._readyState = CONNECTING;
      this._protocol = void 0;
      this._extensions = "";
      this._bufferedAmount = 0;
      this._binaryType = "arraybuffer";
      this._connection = void 0;
      this._client = new WebSocketClient(clientConfig);
      this._client.on("connect", function(connection) {
        onConnect.call(self2, connection);
      });
      this._client.on("connectFailed", function() {
        onConnectFailed.call(self2);
      });
      this._client.connect(url, protocols, origin, headers, requestOptions);
    }
    Object.defineProperties(W3CWebSocket.prototype, {
      url: { get: function() {
        return this._url;
      } },
      readyState: { get: function() {
        return this._readyState;
      } },
      protocol: { get: function() {
        return this._protocol;
      } },
      extensions: { get: function() {
        return this._extensions;
      } },
      bufferedAmount: { get: function() {
        return this._bufferedAmount;
      } }
    });
    Object.defineProperties(W3CWebSocket.prototype, {
      binaryType: {
        get: function() {
          return this._binaryType;
        },
        set: function(type) {
          if (type !== "arraybuffer") {
            throw new SyntaxError('just "arraybuffer" type allowed for "binaryType" attribute');
          }
          this._binaryType = type;
        }
      }
    });
    [["CONNECTING", CONNECTING], ["OPEN", OPEN], ["CLOSING", CLOSING], ["CLOSED", CLOSED]].forEach(function(property) {
      Object.defineProperty(W3CWebSocket.prototype, property[0], {
        get: function() {
          return property[1];
        }
      });
    });
    [["CONNECTING", CONNECTING], ["OPEN", OPEN], ["CLOSING", CLOSING], ["CLOSED", CLOSED]].forEach(function(property) {
      Object.defineProperty(W3CWebSocket, property[0], {
        get: function() {
          return property[1];
        }
      });
    });
    W3CWebSocket.prototype.send = function(data) {
      if (this._readyState !== OPEN) {
        throw new Error("cannot call send() while not connected");
      }
      if (typeof data === "string" || data instanceof String) {
        this._connection.sendUTF(data);
      } else {
        if (data instanceof Buffer) {
          this._connection.sendBytes(data);
        } else if (data.byteLength || data.byteLength === 0) {
          data = toBuffer(data);
          this._connection.sendBytes(data);
        } else {
          throw new Error("unknown binary data:", data);
        }
      }
    };
    W3CWebSocket.prototype.close = function(code, reason) {
      switch (this._readyState) {
        case CONNECTING:
          onConnectFailed.call(this);
          this._client.on("connect", function(connection) {
            if (code) {
              connection.close(code, reason);
            } else {
              connection.close();
            }
          });
          break;
        case OPEN:
          this._readyState = CLOSING;
          if (code) {
            this._connection.close(code, reason);
          } else {
            this._connection.close();
          }
          break;
        case CLOSING:
        case CLOSED:
          break;
      }
    };
    function createCloseEvent(code, reason) {
      var event = new yaeti.Event("close");
      event.code = code;
      event.reason = reason;
      event.wasClean = typeof code === "undefined" || code === 1e3;
      return event;
    }
    function createMessageEvent(data) {
      var event = new yaeti.Event("message");
      event.data = data;
      return event;
    }
    function onConnect(connection) {
      var self2 = this;
      this._readyState = OPEN;
      this._connection = connection;
      this._protocol = connection.protocol;
      this._extensions = connection.extensions;
      this._connection.on("close", function(code, reason) {
        onClose.call(self2, code, reason);
      });
      this._connection.on("message", function(msg) {
        onMessage.call(self2, msg);
      });
      this.dispatchEvent(new yaeti.Event("open"));
    }
    function onConnectFailed() {
      destroy.call(this);
      this._readyState = CLOSED;
      try {
        this.dispatchEvent(new yaeti.Event("error"));
      } finally {
        this.dispatchEvent(createCloseEvent(1006, "connection failed"));
      }
    }
    function onClose(code, reason) {
      destroy.call(this);
      this._readyState = CLOSED;
      this.dispatchEvent(createCloseEvent(code, reason || ""));
    }
    function onMessage(message) {
      if (message.utf8Data) {
        this.dispatchEvent(createMessageEvent(message.utf8Data));
      } else if (message.binaryData) {
        if (this.binaryType === "arraybuffer") {
          var buffer = message.binaryData;
          var arraybuffer = new ArrayBuffer(buffer.length);
          var view = new Uint8Array(arraybuffer);
          for (var i = 0, len = buffer.length; i < len; ++i) {
            view[i] = buffer[i];
          }
          this.dispatchEvent(createMessageEvent(arraybuffer));
        }
      }
    }
    function destroy() {
      this._client.removeAllListeners();
      if (this._connection) {
        this._connection.removeAllListeners();
      }
    }
  }
});

// node_modules/websocket/lib/Deprecation.js
var require_Deprecation = __commonJS({
  "node_modules/websocket/lib/Deprecation.js"(exports, module2) {
    init_shims();
    var Deprecation = {
      disableWarnings: false,
      deprecationWarningMap: {},
      warn: function(deprecationName) {
        if (!this.disableWarnings && this.deprecationWarningMap[deprecationName]) {
          console.warn("DEPRECATION WARNING: " + this.deprecationWarningMap[deprecationName]);
          this.deprecationWarningMap[deprecationName] = false;
        }
      }
    };
    module2.exports = Deprecation;
  }
});

// node_modules/websocket/package.json
var require_package = __commonJS({
  "node_modules/websocket/package.json"(exports, module2) {
    module2.exports = {
      name: "websocket",
      description: "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
      keywords: [
        "websocket",
        "websockets",
        "socket",
        "networking",
        "comet",
        "push",
        "RFC-6455",
        "realtime",
        "server",
        "client"
      ],
      author: "Brian McKelvey <theturtle32@gmail.com> (https://github.com/theturtle32)",
      contributors: [
        "I\xF1aki Baz Castillo <ibc@aliax.net> (http://dev.sipdoc.net)"
      ],
      version: "1.0.34",
      repository: {
        type: "git",
        url: "https://github.com/theturtle32/WebSocket-Node.git"
      },
      homepage: "https://github.com/theturtle32/WebSocket-Node",
      engines: {
        node: ">=4.0.0"
      },
      dependencies: {
        bufferutil: "^4.0.1",
        debug: "^2.2.0",
        "es5-ext": "^0.10.50",
        "typedarray-to-buffer": "^3.1.5",
        "utf-8-validate": "^5.0.2",
        yaeti: "^0.0.6"
      },
      devDependencies: {
        "buffer-equal": "^1.0.0",
        gulp: "^4.0.2",
        "gulp-jshint": "^2.0.4",
        "jshint-stylish": "^2.2.1",
        jshint: "^2.0.0",
        tape: "^4.9.1"
      },
      config: {
        verbose: false
      },
      scripts: {
        test: "tape test/unit/*.js",
        gulp: "gulp"
      },
      main: "index",
      directories: {
        lib: "./lib"
      },
      browser: "lib/browser.js",
      license: "Apache-2.0"
    };
  }
});

// node_modules/websocket/lib/version.js
var require_version5 = __commonJS({
  "node_modules/websocket/lib/version.js"(exports, module2) {
    init_shims();
    module2.exports = require_package().version;
  }
});

// node_modules/websocket/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/websocket/lib/websocket.js"(exports, module2) {
    init_shims();
    module2.exports = {
      "server": require_WebSocketServer(),
      "client": require_WebSocketClient(),
      "router": require_WebSocketRouter(),
      "frame": require_WebSocketFrame(),
      "request": require_WebSocketRequest(),
      "connection": require_WebSocketConnection(),
      "w3cwebsocket": require_W3CWebSocket(),
      "deprecation": require_Deprecation(),
      "version": require_version5()
    };
  }
});

// node_modules/websocket/index.js
var require_websocket2 = __commonJS({
  "node_modules/websocket/index.js"(exports, module2) {
    init_shims();
    module2.exports = require_websocket();
  }
});

// node_modules/@supabase/realtime-js/dist/main/lib/serializer.js
var require_serializer = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/lib/serializer.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Serializer = class {
      constructor() {
        this.HEADER_LENGTH = 1;
      }
      decode(rawPayload, callback) {
        if (rawPayload.constructor === ArrayBuffer) {
          return callback(this._binaryDecode(rawPayload));
        }
        if (typeof rawPayload === "string") {
          return callback(JSON.parse(rawPayload));
        }
        return callback({});
      }
      _binaryDecode(buffer) {
        const view = new DataView(buffer);
        const decoder = new TextDecoder();
        return this._decodeBroadcast(buffer, view, decoder);
      }
      _decodeBroadcast(buffer, view, decoder) {
        const topicSize = view.getUint8(1);
        const eventSize = view.getUint8(2);
        let offset = this.HEADER_LENGTH + 2;
        const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
        offset = offset + topicSize;
        const event = decoder.decode(buffer.slice(offset, offset + eventSize));
        offset = offset + eventSize;
        const data = JSON.parse(decoder.decode(buffer.slice(offset, buffer.byteLength)));
        return { ref: null, topic, event, payload: data };
      }
    };
    exports.default = Serializer;
  }
});

// node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js
var require_RealtimeClient = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var constants_1 = require_constants4();
    var timer_1 = __importDefault(require_timer());
    var RealtimeSubscription_1 = __importDefault(require_RealtimeSubscription());
    var websocket_1 = require_websocket2();
    var serializer_1 = __importDefault(require_serializer());
    var noop2 = () => {
    };
    var RealtimeClient = class {
      constructor(endPoint, options2) {
        this.channels = [];
        this.endPoint = "";
        this.headers = constants_1.DEFAULT_HEADERS;
        this.params = {};
        this.timeout = constants_1.DEFAULT_TIMEOUT;
        this.transport = websocket_1.w3cwebsocket;
        this.heartbeatIntervalMs = 3e4;
        this.longpollerTimeout = 2e4;
        this.heartbeatTimer = void 0;
        this.pendingHeartbeatRef = null;
        this.ref = 0;
        this.logger = noop2;
        this.conn = null;
        this.sendBuffer = [];
        this.serializer = new serializer_1.default();
        this.stateChangeCallbacks = {
          open: [],
          close: [],
          error: [],
          message: []
        };
        this.endPoint = `${endPoint}/${constants_1.TRANSPORTS.websocket}`;
        if (options2 === null || options2 === void 0 ? void 0 : options2.params)
          this.params = options2.params;
        if (options2 === null || options2 === void 0 ? void 0 : options2.headers)
          this.headers = Object.assign(Object.assign({}, this.headers), options2.headers);
        if (options2 === null || options2 === void 0 ? void 0 : options2.timeout)
          this.timeout = options2.timeout;
        if (options2 === null || options2 === void 0 ? void 0 : options2.logger)
          this.logger = options2.logger;
        if (options2 === null || options2 === void 0 ? void 0 : options2.transport)
          this.transport = options2.transport;
        if (options2 === null || options2 === void 0 ? void 0 : options2.heartbeatIntervalMs)
          this.heartbeatIntervalMs = options2.heartbeatIntervalMs;
        if (options2 === null || options2 === void 0 ? void 0 : options2.longpollerTimeout)
          this.longpollerTimeout = options2.longpollerTimeout;
        this.reconnectAfterMs = (options2 === null || options2 === void 0 ? void 0 : options2.reconnectAfterMs) ? options2.reconnectAfterMs : (tries) => {
          return [1e3, 2e3, 5e3, 1e4][tries - 1] || 1e4;
        };
        this.encode = (options2 === null || options2 === void 0 ? void 0 : options2.encode) ? options2.encode : (payload, callback) => {
          return callback(JSON.stringify(payload));
        };
        this.decode = (options2 === null || options2 === void 0 ? void 0 : options2.decode) ? options2.decode : this.serializer.decode.bind(this.serializer);
        this.reconnectTimer = new timer_1.default(() => __awaiter(this, void 0, void 0, function* () {
          yield this.disconnect();
          this.connect();
        }), this.reconnectAfterMs);
      }
      connect() {
        if (this.conn) {
          return;
        }
        this.conn = new this.transport(this.endPointURL(), [], null, this.headers);
        if (this.conn) {
          this.conn.binaryType = "arraybuffer";
          this.conn.onopen = () => this._onConnOpen();
          this.conn.onerror = (error2) => this._onConnError(error2);
          this.conn.onmessage = (event) => this.onConnMessage(event);
          this.conn.onclose = (event) => this._onConnClose(event);
        }
      }
      disconnect(code, reason) {
        return new Promise((resolve2, _reject) => {
          try {
            if (this.conn) {
              this.conn.onclose = function() {
              };
              if (code) {
                this.conn.close(code, reason || "");
              } else {
                this.conn.close();
              }
              this.conn = null;
              this.heartbeatTimer && clearInterval(this.heartbeatTimer);
              this.reconnectTimer.reset();
            }
            resolve2({ error: null, data: true });
          } catch (error2) {
            resolve2({ error: error2, data: false });
          }
        });
      }
      log(kind, msg, data) {
        this.logger(kind, msg, data);
      }
      onOpen(callback) {
        this.stateChangeCallbacks.open.push(callback);
      }
      onClose(callback) {
        this.stateChangeCallbacks.close.push(callback);
      }
      onError(callback) {
        this.stateChangeCallbacks.error.push(callback);
      }
      onMessage(callback) {
        this.stateChangeCallbacks.message.push(callback);
      }
      connectionState() {
        switch (this.conn && this.conn.readyState) {
          case constants_1.SOCKET_STATES.connecting:
            return "connecting";
          case constants_1.SOCKET_STATES.open:
            return "open";
          case constants_1.SOCKET_STATES.closing:
            return "closing";
          default:
            return "closed";
        }
      }
      isConnected() {
        return this.connectionState() === "open";
      }
      remove(channel) {
        this.channels = this.channels.filter((c) => c.joinRef() !== channel.joinRef());
      }
      channel(topic, chanParams = {}) {
        let chan = new RealtimeSubscription_1.default(topic, chanParams, this);
        this.channels.push(chan);
        return chan;
      }
      push(data) {
        let { topic, event, payload, ref } = data;
        let callback = () => {
          this.encode(data, (result) => {
            var _a;
            (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(result);
          });
        };
        this.log("push", `${topic} ${event} (${ref})`, payload);
        if (this.isConnected()) {
          callback();
        } else {
          this.sendBuffer.push(callback);
        }
      }
      onConnMessage(rawMessage) {
        this.decode(rawMessage.data, (msg) => {
          let { topic, event, payload, ref } = msg;
          if (ref && ref === this.pendingHeartbeatRef) {
            this.pendingHeartbeatRef = null;
          } else if (event === (payload === null || payload === void 0 ? void 0 : payload.type)) {
            this._resetHeartbeat();
          }
          this.log("receive", `${payload.status || ""} ${topic} ${event} ${ref && "(" + ref + ")" || ""}`, payload);
          this.channels.filter((channel) => channel.isMember(topic)).forEach((channel) => channel.trigger(event, payload, ref));
          this.stateChangeCallbacks.message.forEach((callback) => callback(msg));
        });
      }
      endPointURL() {
        return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: constants_1.VSN }));
      }
      makeRef() {
        let newRef = this.ref + 1;
        if (newRef === this.ref) {
          this.ref = 0;
        } else {
          this.ref = newRef;
        }
        return this.ref.toString();
      }
      _onConnOpen() {
        this.log("transport", `connected to ${this.endPointURL()}`);
        this._flushSendBuffer();
        this.reconnectTimer.reset();
        this._resetHeartbeat();
        this.stateChangeCallbacks.open.forEach((callback) => callback());
      }
      _onConnClose(event) {
        this.log("transport", "close", event);
        this._triggerChanError();
        this.heartbeatTimer && clearInterval(this.heartbeatTimer);
        this.reconnectTimer.scheduleTimeout();
        this.stateChangeCallbacks.close.forEach((callback) => callback(event));
      }
      _onConnError(error2) {
        this.log("transport", error2.message);
        this._triggerChanError();
        this.stateChangeCallbacks.error.forEach((callback) => callback(error2));
      }
      _triggerChanError() {
        this.channels.forEach((channel) => channel.trigger(constants_1.CHANNEL_EVENTS.error));
      }
      _appendParams(url, params) {
        if (Object.keys(params).length === 0) {
          return url;
        }
        const prefix = url.match(/\?/) ? "&" : "?";
        const query = new URLSearchParams(params);
        return `${url}${prefix}${query}`;
      }
      _flushSendBuffer() {
        if (this.isConnected() && this.sendBuffer.length > 0) {
          this.sendBuffer.forEach((callback) => callback());
          this.sendBuffer = [];
        }
      }
      _resetHeartbeat() {
        this.pendingHeartbeatRef = null;
        this.heartbeatTimer && clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => this._sendHeartbeat(), this.heartbeatIntervalMs);
      }
      _sendHeartbeat() {
        var _a;
        if (!this.isConnected()) {
          return;
        }
        if (this.pendingHeartbeatRef) {
          this.pendingHeartbeatRef = null;
          this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
          (_a = this.conn) === null || _a === void 0 ? void 0 : _a.close(constants_1.WS_CLOSE_NORMAL, "hearbeat timeout");
          return;
        }
        this.pendingHeartbeatRef = this.makeRef();
        this.push({
          topic: "phoenix",
          event: "heartbeat",
          payload: {},
          ref: this.pendingHeartbeatRef
        });
      }
    };
    exports.default = RealtimeClient;
  }
});

// node_modules/@supabase/realtime-js/dist/main/index.js
var require_main3 = __commonJS({
  "node_modules/@supabase/realtime-js/dist/main/index.js"(exports) {
    init_shims();
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Transformers = exports.RealtimeSubscription = exports.RealtimeClient = void 0;
    var Transformers = __importStar(require_transformers());
    exports.Transformers = Transformers;
    var RealtimeClient_1 = __importDefault(require_RealtimeClient());
    exports.RealtimeClient = RealtimeClient_1.default;
    var RealtimeSubscription_1 = __importDefault(require_RealtimeSubscription());
    exports.RealtimeSubscription = RealtimeSubscription_1.default;
  }
});

// node_modules/@supabase/supabase-js/dist/main/lib/SupabaseRealtimeClient.js
var require_SupabaseRealtimeClient = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/lib/SupabaseRealtimeClient.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseRealtimeClient = void 0;
    var realtime_js_1 = require_main3();
    var SupabaseRealtimeClient = class {
      constructor(socket, schema, tableName) {
        const topic = tableName === "*" ? `realtime:${schema}` : `realtime:${schema}:${tableName}`;
        this.subscription = socket.channel(topic);
      }
      getPayloadRecords(payload) {
        const records = {
          new: {},
          old: {}
        };
        if (payload.type === "INSERT" || payload.type === "UPDATE") {
          records.new = realtime_js_1.Transformers.convertChangeData(payload.columns, payload.record);
        }
        if (payload.type === "UPDATE" || payload.type === "DELETE") {
          records.old = realtime_js_1.Transformers.convertChangeData(payload.columns, payload.old_record);
        }
        return records;
      }
      on(event, callback) {
        this.subscription.on(event, (payload) => {
          let enrichedPayload = {
            schema: payload.schema,
            table: payload.table,
            commit_timestamp: payload.commit_timestamp,
            eventType: payload.type,
            new: {},
            old: {}
          };
          enrichedPayload = Object.assign(Object.assign({}, enrichedPayload), this.getPayloadRecords(payload));
          callback(enrichedPayload);
        });
        return this;
      }
      subscribe(callback = () => {
      }) {
        this.subscription.onError((e) => callback("SUBSCRIPTION_ERROR", e));
        this.subscription.onClose(() => callback("CLOSED"));
        this.subscription.subscribe().receive("ok", () => callback("SUBSCRIBED")).receive("error", (e) => callback("SUBSCRIPTION_ERROR", e)).receive("timeout", () => callback("RETRYING_AFTER_TIMEOUT"));
        return this.subscription;
      }
    };
    exports.SupabaseRealtimeClient = SupabaseRealtimeClient;
  }
});

// node_modules/@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder.js
var require_SupabaseQueryBuilder = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseQueryBuilder = void 0;
    var postgrest_js_1 = require_main2();
    var SupabaseRealtimeClient_1 = require_SupabaseRealtimeClient();
    var SupabaseQueryBuilder = class extends postgrest_js_1.PostgrestQueryBuilder {
      constructor(url, { headers = {}, schema, realtime, table }) {
        super(url, { headers, schema });
        this._subscription = new SupabaseRealtimeClient_1.SupabaseRealtimeClient(realtime, schema, table);
        this._realtime = realtime;
      }
      on(event, callback) {
        if (!this._realtime.isConnected()) {
          this._realtime.connect();
        }
        return this._subscription.on(event, callback);
      }
    };
    exports.SupabaseQueryBuilder = SupabaseQueryBuilder;
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/fetch.js
var require_fetch2 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/fetch.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remove = exports.put = exports.post = exports.get = void 0;
    var cross_fetch_1 = __importDefault(require_node_ponyfill());
    var _getErrorMessage = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
    var handleError = (error2, reject) => {
      if (typeof error2.json !== "function") {
        return reject(error2);
      }
      error2.json().then((err) => {
        return reject({
          message: _getErrorMessage(err),
          status: (error2 === null || error2 === void 0 ? void 0 : error2.status) || 500
        });
      });
    };
    var _getRequestParams = (method, options2, parameters, body) => {
      const params = { method, headers: (options2 === null || options2 === void 0 ? void 0 : options2.headers) || {} };
      if (method === "GET") {
        return params;
      }
      params.headers = Object.assign({ "Content-Type": "application/json" }, options2 === null || options2 === void 0 ? void 0 : options2.headers);
      params.body = JSON.stringify(body);
      return Object.assign(Object.assign({}, params), parameters);
    };
    function _handleRequest(method, url, options2, parameters, body) {
      return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve2, reject) => {
          cross_fetch_1.default(url, _getRequestParams(method, options2, parameters, body)).then((result) => {
            if (!result.ok)
              throw result;
            if (options2 === null || options2 === void 0 ? void 0 : options2.noResolveJson)
              return resolve2(result);
            return result.json();
          }).then((data) => resolve2(data)).catch((error2) => handleError(error2, reject));
        });
      });
    }
    function get(url, options2, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("GET", url, options2, parameters);
      });
    }
    exports.get = get;
    function post(url, body, options2, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("POST", url, options2, parameters, body);
      });
    }
    exports.post = post;
    function put(url, body, options2, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("PUT", url, options2, parameters, body);
      });
    }
    exports.put = put;
    function remove(url, body, options2, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("DELETE", url, options2, parameters, body);
      });
    }
    exports.remove = remove;
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/version.js
var require_version6 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/version.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.version = void 0;
    exports.version = "0.0.0";
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/constants.js
var require_constants5 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/constants.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_HEADERS = void 0;
    var version_1 = require_version6();
    exports.DEFAULT_HEADERS = { "X-Client-Info": `storage-js/${version_1.version}` };
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/StorageBucketApi.js
var require_StorageBucketApi = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/StorageBucketApi.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageBucketApi = void 0;
    var fetch_1 = require_fetch2();
    var constants_1 = require_constants5();
    var StorageBucketApi = class {
      constructor(url, headers = {}) {
        this.url = url;
        this.headers = Object.assign(Object.assign({}, constants_1.DEFAULT_HEADERS), headers);
      }
      listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.get(`${this.url}/bucket`, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      getBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.get(`${this.url}/bucket/${id}`, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      createBucket(id, options2 = { public: false }) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.post(`${this.url}/bucket`, { id, name: id, public: options2.public }, { headers: this.headers });
            return { data: data.name, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      updateBucket(id, options2) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.put(`${this.url}/bucket/${id}`, { id, name: id, public: options2.public }, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      emptyBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.post(`${this.url}/bucket/${id}/empty`, {}, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      deleteBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.remove(`${this.url}/bucket/${id}`, {}, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
    };
    exports.StorageBucketApi = StorageBucketApi;
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/StorageFileApi.js
var require_StorageFileApi = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/StorageFileApi.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageFileApi = void 0;
    var fetch_1 = require_fetch2();
    var cross_fetch_1 = __importDefault(require_node_ponyfill());
    var DEFAULT_SEARCH_OPTIONS = {
      limit: 100,
      offset: 0,
      sortBy: {
        column: "name",
        order: "asc"
      }
    };
    var DEFAULT_FILE_OPTIONS = {
      cacheControl: "3600",
      contentType: "text/plain;charset=UTF-8",
      upsert: false
    };
    var StorageFileApi = class {
      constructor(url, headers = {}, bucketId) {
        this.url = url;
        this.headers = headers;
        this.bucketId = bucketId;
      }
      uploadOrUpdate(method, path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            let body;
            const options2 = Object.assign(Object.assign({}, DEFAULT_FILE_OPTIONS), fileOptions);
            const headers = Object.assign(Object.assign({}, this.headers), method === "POST" && { "x-upsert": String(options2.upsert) });
            if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
              body = new FormData();
              body.append("cacheControl", options2.cacheControl);
              body.append("", fileBody);
            } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
              body = fileBody;
              body.append("cacheControl", options2.cacheControl);
            } else {
              body = fileBody;
              headers["cache-control"] = `max-age=${options2.cacheControl}`;
              headers["content-type"] = options2.contentType;
            }
            const _path = this._getFinalPath(path);
            const res = yield cross_fetch_1.default(`${this.url}/object/${_path}`, {
              method,
              body,
              headers
            });
            if (res.ok) {
              return { data: { Key: _path }, error: null };
            } else {
              const error2 = yield res.json();
              return { data: null, error: error2 };
            }
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      upload(path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
        });
      }
      update(path, fileBody, fileOptions) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
        });
      }
      move(fromPath, toPath) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.post(`${this.url}/object/move`, { bucketId: this.bucketId, sourceKey: fromPath, destinationKey: toPath }, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      createSignedUrl(path, expiresIn) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const _path = this._getFinalPath(path);
            let data = yield fetch_1.post(`${this.url}/object/sign/${_path}`, { expiresIn }, { headers: this.headers });
            const signedURL = `${this.url}${data.signedURL}`;
            data = { signedURL };
            return { data, error: null, signedURL };
          } catch (error2) {
            return { data: null, error: error2, signedURL: null };
          }
        });
      }
      download(path) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const _path = this._getFinalPath(path);
            const res = yield fetch_1.get(`${this.url}/object/${_path}`, {
              headers: this.headers,
              noResolveJson: true
            });
            const data = yield res.blob();
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      getPublicUrl(path) {
        try {
          const _path = this._getFinalPath(path);
          const publicURL = `${this.url}/object/public/${_path}`;
          const data = { publicURL };
          return { data, error: null, publicURL };
        } catch (error2) {
          return { data: null, error: error2, publicURL: null };
        }
      }
      remove(paths) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const data = yield fetch_1.remove(`${this.url}/object/${this.bucketId}`, { prefixes: paths }, { headers: this.headers });
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      list(path, options2, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const body = Object.assign(Object.assign(Object.assign({}, DEFAULT_SEARCH_OPTIONS), options2), { prefix: path || "" });
            const data = yield fetch_1.post(`${this.url}/object/list/${this.bucketId}`, body, { headers: this.headers }, parameters);
            return { data, error: null };
          } catch (error2) {
            return { data: null, error: error2 };
          }
        });
      }
      _getFinalPath(path) {
        return `${this.bucketId}/${path}`;
      }
    };
    exports.StorageFileApi = StorageFileApi;
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/types.js
var require_types3 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/types.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@supabase/storage-js/dist/main/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/lib/index.js"(exports) {
    init_shims();
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_StorageBucketApi(), exports);
    __exportStar(require_StorageFileApi(), exports);
    __exportStar(require_types3(), exports);
    __exportStar(require_constants5(), exports);
  }
});

// node_modules/@supabase/storage-js/dist/main/SupabaseStorageClient.js
var require_SupabaseStorageClient = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/SupabaseStorageClient.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseStorageClient = void 0;
    var lib_1 = require_lib2();
    var SupabaseStorageClient = class extends lib_1.StorageBucketApi {
      constructor(url, headers = {}) {
        super(url, headers);
      }
      from(id) {
        return new lib_1.StorageFileApi(this.url, this.headers, id);
      }
    };
    exports.SupabaseStorageClient = SupabaseStorageClient;
  }
});

// node_modules/@supabase/storage-js/dist/main/index.js
var require_main4 = __commonJS({
  "node_modules/@supabase/storage-js/dist/main/index.js"(exports) {
    init_shims();
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseStorageClient = void 0;
    var SupabaseStorageClient_1 = require_SupabaseStorageClient();
    Object.defineProperty(exports, "SupabaseStorageClient", { enumerable: true, get: function() {
      return SupabaseStorageClient_1.SupabaseStorageClient;
    } });
    __exportStar(require_types3(), exports);
  }
});

// node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js
var require_SupabaseClient = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/SupabaseClient.js"(exports) {
    init_shims();
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve2) {
          resolve2(value);
        });
      }
      return new (P || (P = Promise))(function(resolve2, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var constants_1 = require_constants();
    var SupabaseAuthClient_1 = require_SupabaseAuthClient();
    var SupabaseQueryBuilder_1 = require_SupabaseQueryBuilder();
    var storage_js_1 = require_main4();
    var postgrest_js_1 = require_main2();
    var realtime_js_1 = require_main3();
    var DEFAULT_OPTIONS = {
      schema: "public",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      headers: constants_1.DEFAULT_HEADERS
    };
    var SupabaseClient = class {
      constructor(supabaseUrl, supabaseKey, options2) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        if (!supabaseUrl)
          throw new Error("supabaseUrl is required.");
        if (!supabaseKey)
          throw new Error("supabaseKey is required.");
        const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options2);
        this.restUrl = `${supabaseUrl}/rest/v1`;
        this.realtimeUrl = `${supabaseUrl}/realtime/v1`.replace("http", "ws");
        this.authUrl = `${supabaseUrl}/auth/v1`;
        this.storageUrl = `${supabaseUrl}/storage/v1`;
        this.schema = settings.schema;
        this.auth = this._initSupabaseAuthClient(settings);
        this.realtime = this._initRealtimeClient(settings.realtime);
      }
      get storage() {
        return new storage_js_1.SupabaseStorageClient(this.storageUrl, this._getAuthHeaders());
      }
      from(table) {
        const url = `${this.restUrl}/${table}`;
        return new SupabaseQueryBuilder_1.SupabaseQueryBuilder(url, {
          headers: this._getAuthHeaders(),
          schema: this.schema,
          realtime: this.realtime,
          table
        });
      }
      rpc(fn, params, { count = null } = {}) {
        const rest = this._initPostgRESTClient();
        return rest.rpc(fn, params, { count });
      }
      removeSubscription(subscription) {
        return new Promise((resolve2) => __awaiter(this, void 0, void 0, function* () {
          try {
            yield this._closeSubscription(subscription);
            const openSubscriptions = this.getSubscriptions().length;
            if (!openSubscriptions) {
              const { error: error2 } = yield this.realtime.disconnect();
              if (error2)
                return resolve2({ error: error2 });
            }
            return resolve2({ error: null, data: { openSubscriptions } });
          } catch (error2) {
            return resolve2({ error: error2 });
          }
        }));
      }
      _closeSubscription(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
          if (!subscription.isClosed()) {
            yield this._closeChannel(subscription);
          }
        });
      }
      getSubscriptions() {
        return this.realtime.channels;
      }
      _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, localStorage, headers }) {
        const authHeaders = {
          Authorization: `Bearer ${this.supabaseKey}`,
          apikey: `${this.supabaseKey}`
        };
        return new SupabaseAuthClient_1.SupabaseAuthClient({
          url: this.authUrl,
          headers: Object.assign(Object.assign({}, headers), authHeaders),
          autoRefreshToken,
          persistSession,
          detectSessionInUrl,
          localStorage
        });
      }
      _initRealtimeClient(options2) {
        return new realtime_js_1.RealtimeClient(this.realtimeUrl, Object.assign(Object.assign({}, options2), { params: Object.assign(Object.assign({}, options2 === null || options2 === void 0 ? void 0 : options2.params), { apikey: this.supabaseKey }) }));
      }
      _initPostgRESTClient() {
        return new postgrest_js_1.PostgrestClient(this.restUrl, {
          headers: this._getAuthHeaders(),
          schema: this.schema
        });
      }
      _getAuthHeaders() {
        var _a, _b;
        const headers = constants_1.DEFAULT_HEADERS;
        const authBearer = (_b = (_a = this.auth.session()) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
        headers["apikey"] = this.supabaseKey;
        headers["Authorization"] = `Bearer ${authBearer}`;
        return headers;
      }
      _closeChannel(subscription) {
        return new Promise((resolve2, reject) => {
          subscription.unsubscribe().receive("ok", () => {
            this.realtime.remove(subscription);
            return resolve2(true);
          }).receive("error", (e) => reject(e));
        });
      }
    };
    exports.default = SupabaseClient;
  }
});

// node_modules/@supabase/supabase-js/dist/main/index.js
var require_main5 = __commonJS({
  "node_modules/@supabase/supabase-js/dist/main/index.js"(exports) {
    init_shims();
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m)
        if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
          __createBinding(exports2, m, p);
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SupabaseClient = exports.createClient = void 0;
    var SupabaseClient_1 = __importDefault(require_SupabaseClient());
    exports.SupabaseClient = SupabaseClient_1.default;
    __exportStar(require_main(), exports);
    __exportStar(require_main3(), exports);
    var createClient2 = (supabaseUrl, supabaseKey, options2) => {
      return new SupabaseClient_1.default(supabaseUrl, supabaseKey, options2);
    };
    exports.createClient = createClient2;
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();
var import_dayjs = __toModule(require_dayjs_min());
var import_toastify_js = __toModule(require_toastify());
var import_supabase_js = __toModule(require_main5());
var __require2 = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue$1.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue$1.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue$1.length; i += 2) {
            subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
          }
          subscriber_queue$1.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable$1($session);
    const props = {
      stores: {
        page: writable$1(null),
        navigating: writable$1(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    });
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of __privateGet(this, _map))
      yield key;
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
_map = new WeakMap();
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(request2.path);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
var identity = (x) => x;
function assign(tar, src2) {
  for (const k in src2)
    tar[k] = src2[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var is_client = typeof window !== "undefined";
var now = is_client ? () => window.performance.now() : () => Date.now();
var raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
var tasks = new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$n = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$n);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="/logo/Logo1@1x.png" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    <link\n      href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap"\n      rel="stylesheet"\n    />\n    <link\n      rel="stylesheet"\n      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css"\n    />\n\n    <link\n      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"\n      rel="stylesheet"\n      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"\n      crossorigin="anonymous"\n    />\n    <script\n      src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"\n      integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"\n      crossorigin="anonymous"\n    ><\/script>\n    <link\n      rel="stylesheet"\n      href="https://fonts.googleapis.com/icon?family=Material+Icons"\n    />\n    <link\n      href="https://fonts.googleapis.com/css2?family=Gemunu+Libre"\n      rel="stylesheet"\n    />\n    <script src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.js"><\/script>\n    ' + head + '\n\n    <style>\n      @font-face {\n        font-family: "Thunder Bold";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 700;\n      }\n      @font-face {\n        font-family: "Thunder Medium";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 500;\n      }\n      @font-face {\n        font-family: "Thunder Light";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 300;\n      }\n      body,\n      html {\n        margin: 0;\n        padding: 0;\n        font-family: "Gemunu Lobre", sans-serif;\n        overflow-x: hidden;\n        background: #212529;\n      }\n      ::-webkit-scrollbar {\n        display: none;\n        width: 0.5rem;\n        scroll-behavior: smooth;\n      }\n\n      .animated-beat {\n        animation: beat;\n      }\n      @keyframes beat {\n        from {\n          transform: scale(2);\n        }\n      }\n    </style>\n  </head>\n  <body class="bg-gray-900">\n    <div id="svelte">' + body + "</div>\n  </body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-16fae6a4.js",
      css: [assets + "/_app/assets/start-61d1577b.css", assets + "/_app/assets/vendor-571c4b4e.css"],
      js: [assets + "/_app/start-16fae6a4.js", assets + "/_app/chunks/vendor-969998bb.js", assets + "/_app/chunks/singletons-12a22614.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root$1,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d = decodeURIComponent;
var empty = () => ({});
var manifest = {
  assets: [{ "file": "74017-wave-loop.json", "size": 76023, "type": "application/json" }, { "file": "dot.png", "size": 548, "type": "image/png" }, { "file": "font/Thunder-VF.otf", "size": 178752, "type": "font/otf" }, { "file": "font/Thunder-VF.ttf", "size": 103524, "type": "font/ttf" }, { "file": "hero.jpg", "size": 80425, "type": "image/jpeg" }, { "file": "illustrations/bg.svg", "size": 74266, "type": "image/svg+xml" }, { "file": "illustrations/undraw_authentication_fsn5.svg", "size": 29406, "type": "image/svg+xml" }, { "file": "illustrations/undraw_begin_chat_c6pj.svg", "size": 23567, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Co-working_re_w93t.svg", "size": 43828, "type": "image/svg+xml" }, { "file": "illustrations/undraw_community_8nwl.svg", "size": 20288, "type": "image/svg+xml" }, { "file": "illustrations/undraw_enter_uhqk.svg", "size": 8066, "type": "image/svg+xml" }, { "file": "illustrations/undraw_handcrafts_add_files.svg", "size": 10781, "type": "image/svg+xml" }, { "file": "illustrations/undraw_handcrafts_say_hello.svg", "size": 4978, "type": "image/svg+xml" }, { "file": "illustrations/undraw_handcrafts_welcome.svg", "size": 14567, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Live_photo_re_4khn.svg", "size": 6340, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Messaging_fun_re_vic9.svg", "size": 9232, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Online_party_re_7t6g.svg", "size": 13105, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Polaroid_re_481f.svg", "size": 15541, "type": "image/svg+xml" }, { "file": "illustrations/undraw_profile_image_re_ic2f.svg", "size": 7841, "type": "image/svg+xml" }, { "file": "illustrations/undraw_programming_2svr.svg", "size": 20904, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-01.svg", "size": 3879, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-02.svg", "size": 4128, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-03.svg", "size": 3055, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-04.svg", "size": 4766, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-05.svg", "size": 3630, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-06.svg", "size": 3866, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-07.svg", "size": 4118, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-08.svg", "size": 3100, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-09.svg", "size": 2724, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-10.svg", "size": 3056, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-11.svg", "size": 4160, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-12.svg", "size": 2695, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-13.svg", "size": 4124, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-14.svg", "size": 4564, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-15.svg", "size": 3024, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-16.svg", "size": 6277, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-17.svg", "size": 3381, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-18.svg", "size": 3115, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-19.svg", "size": 2162, "type": "image/svg+xml" }, { "file": "illustrations/watermelon/watermelon-pack-illustration-20.svg", "size": 2339, "type": "image/svg+xml" }, { "file": "logo/Logo1.svg", "size": 2999, "type": "image/svg+xml" }, { "file": "logo/Logo1@1x.png", "size": 22346, "type": "image/png" }, { "file": "logo/Logo1@2x.png", "size": 46084, "type": "image/png" }, { "file": "logo/supabase.jpg", "size": 6143, "type": "image/jpeg" }, { "file": "logo/svelte.png", "size": 3705, "type": "image/png" }, { "file": "logo/vercel.png", "size": 8980, "type": "image/png" }],
  layout: "src/routes/__layout.svelte",
  error: "src/routes/__error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/account\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/account.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/contact\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/contact.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/about.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/admin\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/admin/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/admin\/dashboard\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/admin/dashboard/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/posts\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/posts/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/posts\/components\/SlugContent\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/posts/components/SlugContent.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/posts\/([^/]+?)\/?$/,
      params: (m) => ({ slug: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/posts/[slug].svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/index.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/components\/moderatorRequest\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/components/moderatorRequest.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/components\/registeredUsers\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/components/registeredUsers.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/components\/moderators\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/components/moderators.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/components\/overview\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/components/overview.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/components\/posts\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/components/posts.svelte"],
      b: ["src/routes/__error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/root\/dashboard\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/root/dashboard.svelte"],
      b: ["src/routes/__error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
  externalFetch: hooks.externalFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  "src/routes/__error.svelte": () => Promise.resolve().then(function() {
    return __error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$4;
  }),
  "src/routes/account.svelte": () => Promise.resolve().then(function() {
    return account;
  }),
  "src/routes/contact.svelte": () => Promise.resolve().then(function() {
    return contact;
  }),
  "src/routes/about.svelte": () => Promise.resolve().then(function() {
    return about;
  }),
  "src/routes/admin/index.svelte": () => Promise.resolve().then(function() {
    return index$3;
  }),
  "src/routes/admin/dashboard/index.svelte": () => Promise.resolve().then(function() {
    return index$2;
  }),
  "src/routes/posts/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/posts/components/SlugContent.svelte": () => Promise.resolve().then(function() {
    return SlugContent$1;
  }),
  "src/routes/posts/[slug].svelte": () => Promise.resolve().then(function() {
    return _slug_;
  }),
  "src/routes/root/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/root/components/moderatorRequest.svelte": () => Promise.resolve().then(function() {
    return moderatorRequest;
  }),
  "src/routes/root/components/registeredUsers.svelte": () => Promise.resolve().then(function() {
    return registeredUsers;
  }),
  "src/routes/root/components/moderators.svelte": () => Promise.resolve().then(function() {
    return moderators;
  }),
  "src/routes/root/components/overview.svelte": () => Promise.resolve().then(function() {
    return overview;
  }),
  "src/routes/root/components/posts.svelte": () => Promise.resolve().then(function() {
    return posts;
  }),
  "src/routes/root/dashboard.svelte": () => Promise.resolve().then(function() {
    return dashboard;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-fadef62e.js", "css": ["assets/pages/__layout.svelte-7c43af1f.css", "assets/vendor-571c4b4e.css"], "js": ["pages/__layout.svelte-fadef62e.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/__error.svelte": { "entry": "pages/__error.svelte-1d4f90b3.js", "css": ["assets/pages/__error.svelte-b104448b.css", "assets/vendor-571c4b4e.css"], "js": ["pages/__error.svelte-1d4f90b3.js", "chunks/vendor-969998bb.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-a3e0e1bc.js", "css": ["assets/pages/index.svelte-fbdb7f4e.css", "assets/vendor-571c4b4e.css"], "js": ["pages/index.svelte-a3e0e1bc.js", "chunks/vendor-969998bb.js"], "styles": [] }, "src/routes/account.svelte": { "entry": "pages/account.svelte-9ded16f7.js", "css": ["assets/pages/account.svelte-c98cd5ca.css", "assets/toastify-63d0c4b4.css", "assets/vendor-571c4b4e.css"], "js": ["pages/account.svelte-9ded16f7.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js"], "styles": [] }, "src/routes/contact.svelte": { "entry": "pages/contact.svelte-d04ddf7e.js", "css": ["assets/pages/contact.svelte-a20280e4.css", "assets/vendor-571c4b4e.css"], "js": ["pages/contact.svelte-d04ddf7e.js", "chunks/vendor-969998bb.js"], "styles": [] }, "src/routes/about.svelte": { "entry": "pages/about.svelte-ab1266ff.js", "css": ["assets/pages/about.svelte-a5fc52eb.css", "assets/vendor-571c4b4e.css"], "js": ["pages/about.svelte-ab1266ff.js", "chunks/vendor-969998bb.js"], "styles": [] }, "src/routes/admin/index.svelte": { "entry": "pages/admin/index.svelte-6f8abebf.js", "css": ["assets/pages/admin/index.svelte-1756df9d.css", "assets/vendor-571c4b4e.css"], "js": ["pages/admin/index.svelte-6f8abebf.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js"], "styles": [] }, "src/routes/admin/dashboard/index.svelte": { "entry": "pages/admin/dashboard/index.svelte-a51f13dd.js", "css": ["assets/pages/admin/dashboard/index.svelte-4fd536aa.css", "assets/toastify-63d0c4b4.css", "assets/vendor-571c4b4e.css", "assets/AdminPostCard-ebd49e92.css"], "js": ["pages/admin/dashboard/index.svelte-a51f13dd.js", "chunks/vendor-969998bb.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js", "chunks/global-04cce44f.js", "chunks/AdminPostCard-695d917a.js"], "styles": [] }, "src/routes/posts/index.svelte": { "entry": "pages/posts/index.svelte-ab0147f0.js", "css": ["assets/pages/posts/index.svelte-35342271.css", "assets/vendor-571c4b4e.css"], "js": ["pages/posts/index.svelte-ab0147f0.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/posts/components/SlugContent.svelte": { "entry": "pages/posts/components/SlugContent.svelte-c9ee5f23.js", "css": ["assets/pages/posts/components/SlugContent.svelte-52b71608.css", "assets/vendor-571c4b4e.css"], "js": ["pages/posts/components/SlugContent.svelte-c9ee5f23.js", "chunks/vendor-969998bb.js"], "styles": [] }, "src/routes/posts/[slug].svelte": { "entry": "pages/posts/[slug].svelte-ba9c9634.js", "css": ["assets/pages/posts/[slug].svelte-6a0abff9.css", "assets/vendor-571c4b4e.css", "assets/pages/posts/components/SlugContent.svelte-52b71608.css"], "js": ["pages/posts/[slug].svelte-ba9c9634.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js", "pages/posts/components/SlugContent.svelte-c9ee5f23.js"], "styles": [] }, "src/routes/root/index.svelte": { "entry": "pages/root/index.svelte-043d5a64.js", "css": ["assets/pages/root/dashboard.svelte-d10a6205.css", "assets/vendor-571c4b4e.css"], "js": ["pages/root/index.svelte-043d5a64.js", "chunks/vendor-969998bb.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/components/moderatorRequest.svelte": { "entry": "pages/root/components/moderatorRequest.svelte-1a64909f.js", "css": ["assets/pages/root/components/moderatorRequest.svelte-9dffbd2e.css", "assets/vendor-571c4b4e.css"], "js": ["pages/root/components/moderatorRequest.svelte-1a64909f.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/components/registeredUsers.svelte": { "entry": "pages/root/components/registeredUsers.svelte-a6386542.js", "css": ["assets/pages/root/components/moderatorRequest.svelte-9dffbd2e.css", "assets/vendor-571c4b4e.css"], "js": ["pages/root/components/registeredUsers.svelte-a6386542.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/components/moderators.svelte": { "entry": "pages/root/components/moderators.svelte-8c2be78a.js", "css": ["assets/pages/root/components/moderatorRequest.svelte-9dffbd2e.css", "assets/vendor-571c4b4e.css"], "js": ["pages/root/components/moderators.svelte-8c2be78a.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/components/overview.svelte": { "entry": "pages/root/components/overview.svelte-de975660.js", "css": ["assets/pages/root/components/posts.svelte-5a702bb8.css", "assets/vendor-571c4b4e.css"], "js": ["pages/root/components/overview.svelte-de975660.js", "chunks/vendor-969998bb.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/components/posts.svelte": { "entry": "pages/root/components/posts.svelte-40d6b45e.js", "css": ["assets/pages/root/components/posts.svelte-5a702bb8.css", "assets/vendor-571c4b4e.css", "assets/AdminPostCard-ebd49e92.css"], "js": ["pages/root/components/posts.svelte-40d6b45e.js", "chunks/vendor-969998bb.js", "chunks/AdminPostCard-695d917a.js", "chunks/global-04cce44f.js"], "styles": [] }, "src/routes/root/dashboard.svelte": { "entry": "pages/root/dashboard.svelte-4f884885.js", "css": ["assets/pages/root/dashboard.svelte-d10a6205.css", "assets/vendor-571c4b4e.css", "assets/pages/root/components/moderatorRequest.svelte-9dffbd2e.css", "assets/pages/root/components/posts.svelte-5a702bb8.css", "assets/AdminPostCard-ebd49e92.css"], "js": ["pages/root/dashboard.svelte-4f884885.js", "chunks/vendor-969998bb.js", "pages/root/components/moderators.svelte-8c2be78a.js", "chunks/global-04cce44f.js", "pages/root/components/overview.svelte-de975660.js", "pages/root/components/posts.svelte-40d6b45e.js", "chunks/AdminPostCard-695d917a.js", "pages/root/components/registeredUsers.svelte-a6386542.js", "pages/root/components/moderatorRequest.svelte-1a64909f.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender: prerender2
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender: prerender2 });
}
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjAxNTk3OCwiZXhwIjoxOTQ3NTkxOTc4fQ.0T8XLQUmBOidmG8YXoG_FEC8vnKw7_WQGLcJ00LjtNw";
var supabaseURL = "https://sgocnrgwrtdruxnxpxyl.supabase.co";
var supabase = (0, import_supabase_js.createClient)(supabaseURL, SUPABASE_KEY);
var global_account = writable();
var global_account_data = writable();
var css$m = {
  code: ".content.svelte-1ymq3wt.svelte-1ymq3wt{width:100000px}.text.svelte-1ymq3wt.svelte-1ymq3wt{animation-name:svelte-1ymq3wt-animation;animation-timing-function:linear;animation-iteration-count:infinite;float:left}.paused.svelte-1ymq3wt .text.svelte-1ymq3wt{animation-play-state:paused}@keyframes svelte-1ymq3wt-animation{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}",
  map: '{"version":3,"file":"MarqueeTextWidget.svelte","sources":["MarqueeTextWidget.svelte"],"sourcesContent":["<script>\\n  import { onMount } from \\"svelte\\";\\n  export let duration = 15;\\n  export let repeat = 2;\\n  export let paused = false;\\n<\/script>\\n\\n<style>\\n  .content {\\n    width: 100000px;\\n  }\\n  .text {\\n    animation-name: animation;\\n    animation-timing-function: linear;\\n    animation-iteration-count: infinite;\\n    float: left;\\n  }\\n  .paused .text {\\n    animation-play-state: paused;\\n  }\\n  @keyframes animation {\\n    0% {\\n      transform: translateX(0);\\n    }\\n    100% {\\n      transform: translateX(-100%);\\n    }\\n  }\\n</style>\\n\\n<div style=\\"overflow: hidden;\\">\\n  <div class=\\"content\\" class:paused={paused === true}>\\n    {#each Array(repeat) as _, i}\\n      <div class=\\"text\\" style=\\"animation-duration: {duration}s\\">\\n        <slot />\\n      </div>\\n    {/each}\\n  </div>\\n</div>\\n"],"names":[],"mappings":"AAQE,QAAQ,8BAAC,CAAC,AACR,KAAK,CAAE,QAAQ,AACjB,CAAC,AACD,KAAK,8BAAC,CAAC,AACL,cAAc,CAAE,wBAAS,CACzB,yBAAyB,CAAE,MAAM,CACjC,yBAAyB,CAAE,QAAQ,CACnC,KAAK,CAAE,IAAI,AACb,CAAC,AACD,sBAAO,CAAC,KAAK,eAAC,CAAC,AACb,oBAAoB,CAAE,MAAM,AAC9B,CAAC,AACD,WAAW,wBAAU,CAAC,AACpB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,WAAW,CAAC,CAAC,AAC1B,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,WAAW,KAAK,CAAC,AAC9B,CAAC,AACH,CAAC"}'
};
var MarqueeTextWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { duration = 15 } = $$props;
  let { repeat = 2 } = $$props;
  let { paused = false } = $$props;
  if ($$props.duration === void 0 && $$bindings.duration && duration !== void 0)
    $$bindings.duration(duration);
  if ($$props.repeat === void 0 && $$bindings.repeat && repeat !== void 0)
    $$bindings.repeat(repeat);
  if ($$props.paused === void 0 && $$bindings.paused && paused !== void 0)
    $$bindings.paused(paused);
  $$result.css.add(css$m);
  return `<div style="${"overflow: hidden;"}"><div class="${["content svelte-1ymq3wt", paused === true ? "paused" : ""].join(" ").trim()}">${each(Array(repeat), (_, i) => `<div class="${"text svelte-1ymq3wt"}" style="${"animation-duration: " + escape(duration) + "s"}">${slots.default ? slots.default({}) : ``}
      </div>`)}</div></div>`;
});
var css$l = {
  code: '.navContainer.svelte-i8zb38.svelte-i8zb38{position:fixed;top:0;width:100%;transition:500ms ease all;z-index:999;background:transparent;backdrop-filter:blur(10px)}.navContainer.svelte-i8zb38 .navLinks.svelte-i8zb38{width:50%;list-style:none;padding:0;font-size:1.5em;font-family:"Thunder Medium"}.navContainer.svelte-i8zb38 .navLinks li.svelte-i8zb38{position:relative;transition:200ms ease all;text-align:center}.navContainer.svelte-i8zb38 .navLinks li.svelte-i8zb38::after,.navContainer.svelte-i8zb38 .navLinks li.svelte-i8zb38::before{content:"";position:absolute;width:0;height:5px;left:25%;bottom:0;background:#f7749c;transition:200ms ease all;z-index:-1}.navContainer.svelte-i8zb38 .navLinks li.svelte-i8zb38:hover::after{width:50%}@keyframes svelte-i8zb38-slideLeft{0%{opacity:0;height:0;bottom:0%}50%{opacity:1;height:100%;bottom:0%}100%{opacity:0;height:0%;bottom:100%}}.navContainer.svelte-i8zb38 .menuToggler.svelte-i8zb38{width:100px;height:100px;transition:500ms ease all;transform-style:preserve-3d;cursor:pointer}.navContainer.svelte-i8zb38 .menuToggler .menuToggler__active-icon.svelte-i8zb38{opacity:0}.navContainer.svelte-i8zb38 .menuToggler .bi.svelte-i8zb38{position:absolute;left:50%;top:50%;color:white;transition:500ms ease all;font-size:2.5em}.navContainer.svelte-i8zb38 .menuToggler .bi-list.svelte-i8zb38{transform:translateX(-50%) translateY(-50%) translateZ(30px)}.navContainer.svelte-i8zb38 .menuToggler .bi-x-circle.svelte-i8zb38{transform:translateX(-50%) translateY(-50%) translateZ(-30px)}.navContainer.svelte-i8zb38 .menuToggler__active.svelte-i8zb38{transform:rotateY(-0.5turn) rotateX(0.5turn)}.homeButton.svelte-i8zb38.svelte-i8zb38{position:relative;text-align:right;font-family:"Thunder Medium";cursor:pointer;user-select:none;font-size:2em;margin-left:1em}.homeButton.svelte-i8zb38.svelte-i8zb38::after{position:absolute;content:"ABIE G";color:white;opacity:0;width:200%;top:50%;transform:translateY(-50%);left:-50%;font-size:1.5em;transition:200ms ease all;z-index:-1}.homeButton.svelte-i8zb38.svelte-i8zb38:hover::after{left:-25%;opacity:0.2}.menu.svelte-i8zb38.svelte-i8zb38{position:fixed;width:100%;height:100%;background:#231942;top:0;right:0;z-index:998;transition:200ms cubic-bezier(0.69, 0.15, 0.86, 0.29) all;color:white;flex-direction:column;transform:translateX(100%);font-family:"XoloniumRegular";opacity:1;overflow:hidden;box-shadow:#323232 0 0 10px;border-radius:20px;border-top-right-radius:0px;border-bottom-right-radius:0px}.menu-activated.svelte-i8zb38.svelte-i8zb38{opacity:1;transform:translateX(0%);transition:500ms cubic-bezier(0, 0.98, 0, 0.98) all}.menu-activated.svelte-i8zb38.svelte-i8zb38::before{content:"";position:absolute;right:0;top:0;width:100%;height:100%;border:solid white 1em;border-bottom:solid transparent 0;border-right:solid transparent 0;border-top:solid transparent 0;animation:svelte-i8zb38-glow 1s cubic-bezier(0.23, 0.93, 0, 1);opacity:0}@keyframes svelte-i8zb38-glow{0%{opacity:1}10%{opacity:0.5}100%{opacity:0}}a.svelte-i8zb38.svelte-i8zb38{text-decoration:none;color:#f7749c;text-align:right}.menu.svelte-i8zb38 h1.svelte-i8zb38{font-size:5em;text-align:right}.menu__navlinks.svelte-i8zb38.svelte-i8zb38{display:flex;flex-direction:column;justify-content:center;padding:0;margin-right:50px;margin-top:100px;list-style:none;color:#f7749c;font-family:"Thunder Medium"}.menu__navlinks__navlink.svelte-i8zb38.svelte-i8zb38{position:relative;transition:200ms ease all;cursor:pointer;margin-top:2vh}.menu__navlinks__navlink.svelte-i8zb38 h1.svelte-i8zb38{transition:200ms ease all}.menu__navlinks__navlink.svelte-i8zb38:hover h1.svelte-i8zb38{transform:translateX(-25px)}.menu__socials.svelte-i8zb38.svelte-i8zb38{position:absolute;margin-top:100px;display:flex;right:0;width:100%;bottom:10%;justify-content:space-evenly;z-index:3}.menu__socials.svelte-i8zb38 span.svelte-i8zb38{width:50px;height:50px;cursor:pointer;transition:200ms ease all}.menu__socials.svelte-i8zb38 span.svelte-i8zb38:hover{transform:scale(1.2)}.menu__socials.svelte-i8zb38 span.svelte-i8zb38:active{transition:none;transform:scale(0.8)}.bi.svelte-i8zb38.svelte-i8zb38{color:#96c9dc}@media screen and (max-width: 800px){.menu.svelte-i8zb38.svelte-i8zb38{width:100%}.menu__navlinks.svelte-i8zb38.svelte-i8zb38{margin-left:25px}}',
  map: `{"version":3,"file":"FullscreenNav.svelte","sources":["FullscreenNav.svelte"],"sourcesContent":["<script context='module'>\\r\\n\\texport const prerender = true;\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\timport { supabase } from '../global';\\r\\n\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\tlet lastScroll = 0;\\r\\n\\tlet scrollY;\\r\\n\\tlet nav;\\r\\n\\tlet isActivated = false;\\r\\n\\tlet activeNav;\\r\\n\\r\\n\\tconst toggleNav = (e) => {\\r\\n\\t\\tif (isActivated) {\\r\\n\\t\\t\\tisActivated = false;\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\tnav.style.background = 'linear-gradient(180deg, rgba(0, 0, 0, 0.2), transparent)';\\r\\n\\t\\t\\t}, 200);\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tisActivated = true;\\r\\n\\t\\t\\tnav.style.background = 'linear-gradient(0deg, rgba(0, 0, 0, 0), transparent)';\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst toggleNavOff = (e) => {\\r\\n\\t\\tif (isActivated) {\\r\\n\\t\\t\\tisActivated = false;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst hideNav = (e) => {\\r\\n\\t\\tif (scrollY > 100) {\\r\\n\\t\\t\\tnav.style.height = '60px';\\r\\n\\t\\t\\tnav.style.opacity = 0.3;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tnav.style.height = '100px';\\r\\n\\t\\t\\tnav.style.opacity = 1;\\r\\n\\t\\t}\\r\\n\\t\\t// lastScroll = scrollY;\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY on:scroll={hideNav} />\\r\\n\\r\\n<div bind:this={nav} class=\\"navContainer d-flex justify-content-between align-items-center\\">\\r\\n\\t<a href=\\"/\\" class=\\"homeButton ms-5\\" on:click={toggleNavOff}> ABIE G </a>\\r\\n\\t<div\\r\\n\\t\\tclass=\\"menuToggler d-block d-lg-none {isActivated ? 'menuToggler__active' : ''}\\"\\r\\n\\t\\ton:click={toggleNav}\\r\\n\\t>\\r\\n\\t\\t<i style=\\"margin: 0;\\" class=\\"bi bi-x-circle {isActivated ? '' : 'menuToggler__active-icon'}\\" />\\r\\n\\t\\t<i style=\\"margin: -5px;\\" class=\\"bi bi-list {isActivated ? 'menuToggler__active-icon' : ''}\\" />\\r\\n\\t</div>\\r\\n\\r\\n\\t<ul class=\\"navLinks me-3 d-none d-lg-flex mt-3 text-white row row-cols-4\\">\\r\\n\\t\\t<li>\\r\\n\\t\\t\\t<a\\r\\n\\t\\t\\t\\thref=\\"/\\"\\r\\n\\t\\t\\t\\tstyle=\\"color: {activeNav == 1 ? '#688BF7' : 'white'};\\"\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\tactiveNav = 1;\\r\\n\\t\\t\\t\\t\\ttoggleNavOff();\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\tclass=\\"nav-link text-center\\">Home</a\\r\\n\\t\\t\\t>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li>\\r\\n\\t\\t\\t<a\\r\\n\\t\\t\\t\\thref=\\"/posts\\"\\r\\n\\t\\t\\t\\tstyle=\\"color: {activeNav == 2 ? '#688BF7' : 'white'};\\"\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\tactiveNav = 2;\\r\\n\\t\\t\\t\\t\\ttoggleNavOff();\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\tclass=\\"nav-link text-center\\">Posts</a\\r\\n\\t\\t\\t>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li>\\r\\n\\t\\t\\t<a\\r\\n\\t\\t\\t\\thref=\\"/about\\"\\r\\n\\t\\t\\t\\tstyle=\\"color: {activeNav == 3 ? '#688BF7' : 'white'};\\"\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\tactiveNav = 3;\\r\\n\\t\\t\\t\\t\\ttoggleNavOff();\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\tclass=\\"nav-link text-center \\">About us</a\\r\\n\\t\\t\\t>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li>\\r\\n\\t\\t\\t<a\\r\\n\\t\\t\\t\\thref=\\"/account\\"\\r\\n\\t\\t\\t\\tstyle=\\"color: {activeNav == 4 ? '#688BF7' : 'white'};\\"\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\tactiveNav = 4;\\r\\n\\t\\t\\t\\t\\ttoggleNavOff();\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\tclass=\\"nav-link text-center\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\tAccount\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t</ul>\\r\\n</div>\\r\\n\\r\\n<div class=\\"menu d-block d-lg-none {isActivated ? 'menu-activated' : ''}\\">\\r\\n\\t<ul class=\\"menu__navlinks\\">\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/account\\">\\r\\n\\t\\t\\t\\t<h1>ACCOUNT</h1>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/posts\\">\\r\\n\\t\\t\\t\\t<h1>POSTS</h1>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/about\\">\\r\\n\\t\\t\\t\\t<h1>ABOUT</h1>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/contact\\">\\r\\n\\t\\t\\t\\t<h1>CONTACT</h1>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t</ul>\\r\\n\\t<div class=\\"menu__socials\\">\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://www.facebook.com/\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-facebook\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://twitter.com/\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-twitter\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://www.twitch.tv/\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-twitch\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://www.youtube.com/\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-youtube\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://www.instagram.com/\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-instagram\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<style lang=\\"scss\\">.navContainer {\\n  position: fixed;\\n  top: 0;\\n  width: 100%;\\n  transition: 500ms ease all;\\n  z-index: 999;\\n  background: transparent;\\n  backdrop-filter: blur(10px);\\n}\\n.navContainer .navLinks {\\n  width: 50%;\\n  list-style: none;\\n  padding: 0;\\n  font-size: 1.5em;\\n  font-family: \\"Thunder Medium\\";\\n}\\n.navContainer .navLinks li {\\n  position: relative;\\n  transition: 200ms ease all;\\n  text-align: center;\\n}\\n.navContainer .navLinks li::after, .navContainer .navLinks li::before {\\n  content: \\"\\";\\n  position: absolute;\\n  width: 0;\\n  height: 5px;\\n  left: 25%;\\n  bottom: 0;\\n  background: #f7749c;\\n  transition: 200ms ease all;\\n  z-index: -1;\\n}\\n.navContainer .navLinks li:hover::after {\\n  width: 50%;\\n}\\n@keyframes slideLeft {\\n  0% {\\n    opacity: 0;\\n    height: 0;\\n    bottom: 0%;\\n  }\\n  50% {\\n    opacity: 1;\\n    height: 100%;\\n    bottom: 0%;\\n  }\\n  100% {\\n    opacity: 0;\\n    height: 0%;\\n    bottom: 100%;\\n  }\\n}\\n.navContainer .menuToggler {\\n  width: 100px;\\n  height: 100px;\\n  transition: 500ms ease all;\\n  transform-style: preserve-3d;\\n  cursor: pointer;\\n}\\n.navContainer .menuToggler .menuToggler__active-icon {\\n  opacity: 0;\\n}\\n.navContainer .menuToggler .bi {\\n  position: absolute;\\n  left: 50%;\\n  top: 50%;\\n  color: white;\\n  transition: 500ms ease all;\\n  font-size: 2.5em;\\n}\\n.navContainer .menuToggler .bi-list {\\n  transform: translateX(-50%) translateY(-50%) translateZ(30px);\\n}\\n.navContainer .menuToggler .bi-x-circle {\\n  transform: translateX(-50%) translateY(-50%) translateZ(-30px);\\n}\\n.navContainer .menuToggler__active {\\n  transform: rotateY(-0.5turn) rotateX(0.5turn);\\n}\\n\\n.homeButton {\\n  position: relative;\\n  text-align: right;\\n  font-family: \\"Thunder Medium\\";\\n  cursor: pointer;\\n  user-select: none;\\n  font-size: 2em;\\n  margin-left: 1em;\\n}\\n.homeButton::after {\\n  position: absolute;\\n  content: \\"ABIE G\\";\\n  color: white;\\n  opacity: 0;\\n  width: 200%;\\n  top: 50%;\\n  transform: translateY(-50%);\\n  left: -50%;\\n  font-size: 1.5em;\\n  transition: 200ms ease all;\\n  z-index: -1;\\n}\\n.homeButton:hover::after {\\n  left: -25%;\\n  opacity: 0.2;\\n}\\n\\n.menu {\\n  position: fixed;\\n  width: 100%;\\n  height: 100%;\\n  background: #231942;\\n  top: 0;\\n  right: 0;\\n  z-index: 998;\\n  /* clip-path: circle(2rem at calc(100% - 0px) 0px); */\\n  transition: 200ms cubic-bezier(0.69, 0.15, 0.86, 0.29) all;\\n  color: white;\\n  flex-direction: column;\\n  transform: translateX(100%);\\n  font-family: \\"XoloniumRegular\\";\\n  opacity: 1;\\n  overflow: hidden;\\n  box-shadow: #323232 0 0 10px;\\n  border-radius: 20px;\\n  border-top-right-radius: 0px;\\n  border-bottom-right-radius: 0px;\\n}\\n\\n.menu-activated {\\n  opacity: 1;\\n  transform: translateX(0%);\\n  transition: 500ms cubic-bezier(0, 0.98, 0, 0.98) all;\\n}\\n.menu-activated::before {\\n  content: \\"\\";\\n  position: absolute;\\n  right: 0;\\n  top: 0;\\n  width: 100%;\\n  height: 100%;\\n  border: solid white 1em;\\n  border-bottom: solid transparent 0;\\n  border-right: solid transparent 0;\\n  border-top: solid transparent 0;\\n  animation: glow 1s cubic-bezier(0.23, 0.93, 0, 1);\\n  opacity: 0;\\n}\\n@keyframes glow {\\n  0% {\\n    opacity: 1;\\n  }\\n  10% {\\n    opacity: 0.5;\\n  }\\n  100% {\\n    opacity: 0;\\n  }\\n}\\n\\na {\\n  text-decoration: none;\\n  color: #f7749c;\\n  text-align: right;\\n}\\n\\n.menu h1 {\\n  font-size: 5em;\\n  text-align: right;\\n}\\n\\n.menu__navlinks {\\n  display: flex;\\n  flex-direction: column;\\n  justify-content: center;\\n  padding: 0;\\n  margin-right: 50px;\\n  margin-top: 100px;\\n  list-style: none;\\n  color: #f7749c;\\n  font-family: \\"Thunder Medium\\";\\n}\\n\\n.menu__navlinks__navlink {\\n  position: relative;\\n  transition: 200ms ease all;\\n  cursor: pointer;\\n  margin-top: 2vh;\\n}\\n.menu__navlinks__navlink h1 {\\n  transition: 200ms ease all;\\n}\\n.menu__navlinks__navlink:hover h1 {\\n  transform: translateX(-25px);\\n}\\n\\n.menu__socials {\\n  position: absolute;\\n  margin-top: 100px;\\n  display: flex;\\n  right: 0;\\n  width: 100%;\\n  bottom: 10%;\\n  justify-content: space-evenly;\\n  z-index: 3;\\n}\\n\\n.menu__socials span {\\n  width: 50px;\\n  height: 50px;\\n  cursor: pointer;\\n  transition: 200ms ease all;\\n  /* color: #212529; */\\n}\\n\\n.menu__socials span:hover {\\n  transform: scale(1.2);\\n}\\n\\n.menu__socials span:active {\\n  transition: none;\\n  transform: scale(0.8);\\n}\\n\\n.bi {\\n  color: #96c9dc;\\n}\\n\\n@media screen and (max-width: 800px) {\\n  .menu {\\n    width: 100%;\\n  }\\n\\n  .menu__navlinks {\\n    margin-left: 25px;\\n  }\\n}</style>\\r\\n"],"names":[],"mappings":"AA6JmB,aAAa,4BAAC,CAAC,AAChC,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,WAAW,CACvB,eAAe,CAAE,KAAK,IAAI,CAAC,AAC7B,CAAC,AACD,2BAAa,CAAC,SAAS,cAAC,CAAC,AACvB,KAAK,CAAE,GAAG,CACV,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,gBAAgB,AAC/B,CAAC,AACD,2BAAa,CAAC,SAAS,CAAC,EAAE,cAAC,CAAC,AAC1B,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,UAAU,CAAE,MAAM,AACpB,CAAC,AACD,2BAAa,CAAC,SAAS,CAAC,gBAAE,OAAO,CAAE,2BAAa,CAAC,SAAS,CAAC,gBAAE,QAAQ,AAAC,CAAC,AACrE,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,GAAG,CACT,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,EAAE,AACb,CAAC,AACD,2BAAa,CAAC,SAAS,CAAC,gBAAE,MAAM,OAAO,AAAC,CAAC,AACvC,KAAK,CAAE,GAAG,AACZ,CAAC,AACD,WAAW,uBAAU,CAAC,AACpB,EAAE,AAAC,CAAC,AACF,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,EAAE,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,EAAE,AACZ,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,EAAE,CACV,MAAM,CAAE,IAAI,AACd,CAAC,AACH,CAAC,AACD,2BAAa,CAAC,YAAY,cAAC,CAAC,AAC1B,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,eAAe,CAAE,WAAW,CAC5B,MAAM,CAAE,OAAO,AACjB,CAAC,AACD,2BAAa,CAAC,YAAY,CAAC,yBAAyB,cAAC,CAAC,AACpD,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,2BAAa,CAAC,YAAY,CAAC,GAAG,cAAC,CAAC,AAC9B,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,GAAG,CACT,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,SAAS,CAAE,KAAK,AAClB,CAAC,AACD,2BAAa,CAAC,YAAY,CAAC,QAAQ,cAAC,CAAC,AACnC,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,WAAW,IAAI,CAAC,CAAC,WAAW,IAAI,CAAC,AAC/D,CAAC,AACD,2BAAa,CAAC,YAAY,CAAC,YAAY,cAAC,CAAC,AACvC,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,WAAW,IAAI,CAAC,CAAC,WAAW,KAAK,CAAC,AAChE,CAAC,AACD,2BAAa,CAAC,oBAAoB,cAAC,CAAC,AAClC,SAAS,CAAE,QAAQ,QAAQ,CAAC,CAAC,QAAQ,OAAO,CAAC,AAC/C,CAAC,AAED,WAAW,4BAAC,CAAC,AACX,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,WAAW,CAAE,gBAAgB,CAC7B,MAAM,CAAE,OAAO,CACf,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,GAAG,CACd,WAAW,CAAE,GAAG,AAClB,CAAC,AACD,uCAAW,OAAO,AAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,QAAQ,CACjB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,GAAG,CAAE,GAAG,CACR,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,IAAI,CAAE,IAAI,CACV,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,EAAE,AACb,CAAC,AACD,uCAAW,MAAM,OAAO,AAAC,CAAC,AACxB,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,GAAG,AACd,CAAC,AAED,KAAK,4BAAC,CAAC,AACL,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,OAAO,CACnB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,GAAG,CAEZ,UAAU,CAAE,KAAK,CAAC,aAAa,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,GAAG,CAC1D,KAAK,CAAE,KAAK,CACZ,cAAc,CAAE,MAAM,CACtB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,WAAW,CAAE,iBAAiB,CAC9B,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAC5B,aAAa,CAAE,IAAI,CACnB,uBAAuB,CAAE,GAAG,CAC5B,0BAA0B,CAAE,GAAG,AACjC,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,EAAE,CAAC,CACzB,UAAU,CAAE,KAAK,CAAC,aAAa,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,GAAG,AACtD,CAAC,AACD,2CAAe,QAAQ,AAAC,CAAC,AACvB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,CAAC,CACR,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,KAAK,CAAC,KAAK,CAAC,GAAG,CACvB,aAAa,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CAClC,YAAY,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CACjC,UAAU,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CAC/B,SAAS,CAAE,kBAAI,CAAC,EAAE,CAAC,aAAa,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACjD,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,WAAW,kBAAK,CAAC,AACf,EAAE,AAAC,CAAC,AACF,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,OAAO,CAAE,GAAG,AACd,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,AACZ,CAAC,AACH,CAAC,AAED,CAAC,4BAAC,CAAC,AACD,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,mBAAK,CAAC,EAAE,cAAC,CAAC,AACR,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,CAAC,CACV,YAAY,CAAE,IAAI,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,gBAAgB,AAC/B,CAAC,AAED,wBAAwB,4BAAC,CAAC,AACxB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,GAAG,AACjB,CAAC,AACD,sCAAwB,CAAC,EAAE,cAAC,CAAC,AAC3B,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC5B,CAAC,AACD,sCAAwB,MAAM,CAAC,EAAE,cAAC,CAAC,AACjC,SAAS,CAAE,WAAW,KAAK,CAAC,AAC9B,CAAC,AAED,cAAc,4BAAC,CAAC,AACd,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,CAAC,CACR,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CACX,eAAe,CAAE,YAAY,CAC7B,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,4BAAc,CAAC,IAAI,cAAC,CAAC,AACnB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAE5B,CAAC,AAED,4BAAc,CAAC,kBAAI,MAAM,AAAC,CAAC,AACzB,SAAS,CAAE,MAAM,GAAG,CAAC,AACvB,CAAC,AAED,4BAAc,CAAC,kBAAI,OAAO,AAAC,CAAC,AAC1B,UAAU,CAAE,IAAI,CAChB,SAAS,CAAE,MAAM,GAAG,CAAC,AACvB,CAAC,AAED,GAAG,4BAAC,CAAC,AACH,KAAK,CAAE,OAAO,AAChB,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACpC,KAAK,4BAAC,CAAC,AACL,KAAK,CAAE,IAAI,AACb,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,WAAW,CAAE,IAAI,AACnB,CAAC,AACH,CAAC"}`
};
var FullscreenNav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let nav;
  $$result.css.add(css$l);
  return `

<div class="${"navContainer d-flex justify-content-between align-items-center svelte-i8zb38"}"${add_attribute("this", nav, 0)}><a href="${"/"}" class="${"homeButton ms-5 svelte-i8zb38"}">ABIE G </a>
	<div class="${"menuToggler d-block d-lg-none " + escape("") + " svelte-i8zb38"}"><i style="${"margin: 0;"}" class="${"bi bi-x-circle " + escape("menuToggler__active-icon") + " svelte-i8zb38"}"></i>
		<i style="${"margin: -5px;"}" class="${"bi bi-list " + escape("") + " svelte-i8zb38"}"></i></div>

	<ul class="${"navLinks me-3 d-none d-lg-flex mt-3 text-white row row-cols-4 svelte-i8zb38"}"><li class="${"svelte-i8zb38"}"><a href="${"/"}" style="${"color: " + escape("white") + ";"}" class="${"nav-link text-center svelte-i8zb38"}">Home</a></li>
		<li class="${"svelte-i8zb38"}"><a href="${"/posts"}" style="${"color: " + escape("white") + ";"}" class="${"nav-link text-center svelte-i8zb38"}">Posts</a></li>
		<li class="${"svelte-i8zb38"}"><a href="${"/about"}" style="${"color: " + escape("white") + ";"}" class="${"nav-link text-center  svelte-i8zb38"}">About us</a></li>
		<li class="${"svelte-i8zb38"}"><a href="${"/account"}" style="${"color: " + escape("white") + ";"}" class="${"nav-link text-center svelte-i8zb38"}">Account
			</a></li></ul></div>

<div class="${"menu d-block d-lg-none " + escape("") + " svelte-i8zb38"}"><ul class="${"menu__navlinks svelte-i8zb38"}"><li class="${"menu__navlinks__navlink svelte-i8zb38"}"><a href="${"/account"}" class="${"svelte-i8zb38"}"><h1 class="${"svelte-i8zb38"}">ACCOUNT</h1></a></li>
		<li class="${"menu__navlinks__navlink svelte-i8zb38"}"><a href="${"/posts"}" class="${"svelte-i8zb38"}"><h1 class="${"svelte-i8zb38"}">POSTS</h1></a></li>
		<li class="${"menu__navlinks__navlink svelte-i8zb38"}"><a href="${"/about"}" class="${"svelte-i8zb38"}"><h1 class="${"svelte-i8zb38"}">ABOUT</h1></a></li>
		<li class="${"menu__navlinks__navlink svelte-i8zb38"}"><a href="${"/contact"}" class="${"svelte-i8zb38"}"><h1 class="${"svelte-i8zb38"}">CONTACT</h1></a></li></ul>
	<div class="${"menu__socials svelte-i8zb38"}"><span class="${"svelte-i8zb38"}"><a href="${"https://www.facebook.com/"}" class="${"svelte-i8zb38"}"><i class="${"bi bi-facebook svelte-i8zb38"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-i8zb38"}"><a href="${"https://twitter.com/"}" class="${"svelte-i8zb38"}"><i class="${"bi bi-twitter svelte-i8zb38"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-i8zb38"}"><a href="${"https://www.twitch.tv/"}" class="${"svelte-i8zb38"}"><i class="${"bi bi-twitch svelte-i8zb38"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-i8zb38"}"><a href="${"https://www.youtube.com/"}" class="${"svelte-i8zb38"}"><i class="${"bi bi-youtube svelte-i8zb38"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-i8zb38"}"><a href="${"https://www.instagram.com/"}" class="${"svelte-i8zb38"}"><i class="${"bi bi-instagram svelte-i8zb38"}" style="${"font-size: 3em;"}"></i></a></span></div>
</div>`;
});
var css$k = {
  code: ".footer.svelte-kqt1vd{bottom:0;z-index:999}",
  map: `{"version":3,"file":"Footer.svelte","sources":["Footer.svelte"],"sourcesContent":["<script context='module'>\\r\\n\\texport const prerender = true;\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\tlet scrollY;\\r\\n\\tconst scrollToTop = (e) => {\\r\\n\\t\\tscrollY = 0;\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY />\\r\\n\\r\\n<footer class=\\"footer text-white py-5 px-2 bg-grey-900\\">\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t<div\\r\\n\\t\\t\\t\\tclass=\\"col-12 col-lg-4 mb-4 mb-lg-0 d-flex align-items-center justify-content-center\\"\\r\\n\\t\\t\\t\\tstyle=\\"cursor: pointer;\\"\\r\\n\\t\\t\\t\\ton:click={scrollToTop}\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t<p style=\\"font-size: 1.2em; margin: 0;\\">\xA9 2021 | ABIE G</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col-12 col-lg-8 d-flex align-items-center justify-content-around\\">\\r\\n\\t\\t\\t\\t<a class=\\"link-light me-2\\" href=\\"/\\"\\r\\n\\t\\t\\t\\t\\t><i class=\\"bi bi-facebook\\" style=\\"font-size: 1.2em; \\" /></a\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t<a class=\\"link-light me-2\\" href=\\"/\\"\\r\\n\\t\\t\\t\\t\\t><i class=\\"bi bi-twitch\\" style=\\"font-size: 1.2em;\\" /></a\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t<a class=\\"link-light me-2\\" href=\\"/\\"\\r\\n\\t\\t\\t\\t\\t><i class=\\"bi bi-twitter\\" style=\\"font-size: 1.2em;\\" /></a\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t<a class=\\"link-light me-2\\" href=\\"/\\"\\r\\n\\t\\t\\t\\t\\t><i class=\\"bi bi-instagram\\" style=\\"font-size: 1.2em;\\" /></a\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</footer>\\r\\n\\r\\n<style lang=\\"scss\\">.footer {\\n  bottom: 0;\\n  z-index: 999;\\n}\\n\\n/* main {\\n\\tposition: absolute;\\n\\theight: 50px;\\n\\twidth: 100%;\\n\\tbackground: #231942;\\n\\tdisplay: flex;\\n\\tjustify-content: center;\\n\\talign-items: center;\\n\\tcolor: white;\\n\\tborder-top-left-radius: 10px;\\n\\tborder-top-right-radius: 10px;\\n}\\nmain .container {\\n\\twidth: 80vw;\\n\\tdisplay: flex;\\n\\tjustify-content: flex-start;\\n\\talign-items: center;\\n}\\nmain .container img {\\n\\twidth: 40px;\\n\\tmargin-right: 20px;\\n} */</style>\\r\\n"],"names":[],"mappings":"AAyCmB,OAAO,cAAC,CAAC,AAC1B,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,GAAG,AACd,CAAC"}`
};
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$k);
  return `

<footer class="${"footer text-white py-5 px-2 bg-grey-900 svelte-kqt1vd"}"><div class="${"container"}"><div class="${"row"}"><div class="${"col-12 col-lg-4 mb-4 mb-lg-0 d-flex align-items-center justify-content-center"}" style="${"cursor: pointer;"}"><p style="${"font-size: 1.2em; margin: 0;"}">\xA9 2021 | ABIE G</p></div>
			<div class="${"col-12 col-lg-8 d-flex align-items-center justify-content-around"}"><a class="${"link-light me-2"}" href="${"/"}"><i class="${"bi bi-facebook"}" style="${"font-size: 1.2em; "}"></i></a>
				<a class="${"link-light me-2"}" href="${"/"}"><i class="${"bi bi-twitch"}" style="${"font-size: 1.2em;"}"></i></a>
				<a class="${"link-light me-2"}" href="${"/"}"><i class="${"bi bi-twitter"}" style="${"font-size: 1.2em;"}"></i></a>
				<a class="${"link-light me-2"}" href="${"/"}"><i class="${"bi bi-instagram"}" style="${"font-size: 1.2em;"}"></i></a></div></div></div>
</footer>`;
});
var css$j = {
  code: ".scrolltotop.svelte-p4ku7i{position:fixed;width:50px;height:50px;color:#fff;top:calc(85% - 25px);border-radius:100px;background:#002b36;right:0;z-index:99;transition:200ms ease all;display:flex;justify-content:center;align-items:center;cursor:pointer}",
  map: `{"version":3,"file":"__layout.svelte","sources":["__layout.svelte"],"sourcesContent":["<script>\\r\\n\\timport FullscreenNav from '../components/FullscreenNav.svelte';\\r\\n\\timport BackgroundBlob from '../components/BackgroundBlob.svelte';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport Footer from '../components/Footer.svelte';\\r\\n\\r\\n\\tlet mainContainer;\\r\\n\\tlet scrollY;\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY />\\r\\n\\r\\n<FullscreenNav />\\r\\n<main bind:this={mainContainer} />\\r\\n<slot />\\r\\n<Footer />\\r\\n\\r\\n<div\\r\\n\\ton:click={() => {\\r\\n\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\tscrollY = 0;\\r\\n\\t\\t}, 100);\\r\\n\\t}}\\r\\n\\tclass=\\"scrolltotop\\"\\r\\n\\tstyle=\\"right: {scrollY < 400 ? '-50px' : '5px'};\\"\\r\\n>\\r\\n\\t<i class=\\"bi bi-arrow-up\\" />\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.scrolltotop {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\twidth: 50px;\\r\\n\\t\\theight: 50px;\\r\\n\\t\\tcolor: #fff;\\r\\n\\t\\ttop: calc(85% - 25px);\\r\\n\\t\\tborder-radius: 100px;\\r\\n\\t\\tbackground: #002b36;\\r\\n\\t\\tright: 0;\\r\\n\\t\\tz-index: 99;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA8BC,YAAY,cAAC,CAAC,AACb,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,GAAG,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,CACrB,aAAa,CAAE,KAAK,CACpB,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,OAAO,AAChB,CAAC"}`
};
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let mainContainer;
  $$result.css.add(css$j);
  return `

${validate_component(FullscreenNav, "FullscreenNav").$$render($$result, {}, {}, {})}
<main${add_attribute("this", mainContainer, 0)}></main>
${slots.default ? slots.default({}) : ``}
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}

<div class="${"scrolltotop svelte-p4ku7i"}" style="${"right: " + escape("5px") + ";"}"><i class="${"bi bi-arrow-up"}"></i>
</div>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
var css$i = {
  code: "main.svelte-1g748lp.svelte-1g748lp{min-height:100vh;display:flex;justify-content:center;align-items:center;color:white;user-select:none}main.svelte-1g748lp .container.svelte-1g748lp{width:80%;display:flex;flex-direction:column;justify-content:space-around;align-items:flex-start}h1.svelte-1g748lp.svelte-1g748lp{margin-top:3em}",
  map: `{"version":3,"file":"__error.svelte","sources":["__error.svelte"],"sourcesContent":["<main>\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<h4>404</h4>\\r\\n\\t\\t<h1>Page not found</h1>\\r\\n\\t\\t<p>The page you are looking for doesn't exist or has been moved.</p>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tuser-select: none;\\r\\n\\t}\\r\\n\\tmain .container {\\r\\n\\t\\twidth: 80%;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tjustify-content: space-around;\\r\\n\\t\\talign-items: flex-start;\\r\\n\\t}\\r\\n\\th1 {\\r\\n\\t\\tmargin-top: 3em;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AASC,IAAI,8BAAC,CAAC,AACL,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,KAAK,CACZ,WAAW,CAAE,IAAI,AAClB,CAAC,AACD,mBAAI,CAAC,UAAU,eAAC,CAAC,AAChB,KAAK,CAAE,GAAG,CACV,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,YAAY,CAC7B,WAAW,CAAE,UAAU,AACxB,CAAC,AACD,EAAE,8BAAC,CAAC,AACH,UAAU,CAAE,GAAG,AAChB,CAAC"}`
};
var _error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$i);
  return `<main class="${"svelte-1g748lp"}"><div class="${"container svelte-1g748lp"}"><h4>404</h4>
		<h1 class="${"svelte-1g748lp"}">Page not found</h1>
		<p>The page you are looking for doesn&#39;t exist or has been moved.</p></div>
</main>`;
});
var __error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _error
});
var IntersectionObserver_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { element = null } = $$props;
  let { once = false } = $$props;
  let { root = null } = $$props;
  let { rootMargin = "0px" } = $$props;
  let { threshold = 0 } = $$props;
  let { entry = null } = $$props;
  let { intersecting = false } = $$props;
  let { observer = null } = $$props;
  createEventDispatcher();
  if ($$props.element === void 0 && $$bindings.element && element !== void 0)
    $$bindings.element(element);
  if ($$props.once === void 0 && $$bindings.once && once !== void 0)
    $$bindings.once(once);
  if ($$props.root === void 0 && $$bindings.root && root !== void 0)
    $$bindings.root(root);
  if ($$props.rootMargin === void 0 && $$bindings.rootMargin && rootMargin !== void 0)
    $$bindings.rootMargin(rootMargin);
  if ($$props.threshold === void 0 && $$bindings.threshold && threshold !== void 0)
    $$bindings.threshold(threshold);
  if ($$props.entry === void 0 && $$bindings.entry && entry !== void 0)
    $$bindings.entry(entry);
  if ($$props.intersecting === void 0 && $$bindings.intersecting && intersecting !== void 0)
    $$bindings.intersecting(intersecting);
  if ($$props.observer === void 0 && $$bindings.observer && observer !== void 0)
    $$bindings.observer(observer);
  return `${slots.default ? slots.default({ intersecting, entry, observer }) : ``}`;
});
var css$h = {
  code: '@import url("https://fonts.googleapis.com/css2?family=Righteous&display=swap");.loading.svelte-zowgkf.svelte-zowgkf{position:fixed}.floatingImage.svelte-zowgkf.svelte-zowgkf{position:fixed;width:50vw;height:100vh;right:0;display:flex;justify-content:center;align-items:center;z-index:2}.floatingImage.svelte-zowgkf img.svelte-zowgkf{width:100%;height:100%;opacity:0.7;object-fit:cover}.hero.svelte-zowgkf.svelte-zowgkf{position:relative;min-height:100vh;z-index:3}.hero.svelte-zowgkf.svelte-zowgkf:first-child{bottom:10%}.joinButton.svelte-zowgkf.svelte-zowgkf{transition:all 0.2s ease}.joinButton.svelte-zowgkf.svelte-zowgkf:hover{transform:scale(1.05)}.joinButton.svelte-zowgkf.svelte-zowgkf:active{transition:all 0s ease;transform:scale(1)}main.svelte-zowgkf.svelte-zowgkf{transition:500ms ease all;min-height:70vh;perspective:2000px;user-select:none;background:transparent}.brand-container.svelte-zowgkf.svelte-zowgkf{position:absolute;width:100%;height:100%;z-index:1}.brand.svelte-zowgkf.svelte-zowgkf{position:absolute;bottom:35%;left:25px;width:100%;overflow:hidden}.brand.svelte-zowgkf p.svelte-zowgkf{color:transparent;font-weight:600;font-family:"Righteous", cursive;font-size:10em;-webkit-text-stroke-width:0.5px;-webkit-text-stroke-color:white;transition:opacity 200ms ease;letter-spacing:0.2em}.content.svelte-zowgkf.svelte-zowgkf{position:absolute;right:5%;bottom:20%;color:white;z-index:2;text-align:right}.mouse.svelte-zowgkf.svelte-zowgkf{position:fixed;left:calc(50% - 20px);top:90vh;width:40px;height:65px;border-radius:100px;border:solid white 3px;z-index:9}.mouse.svelte-zowgkf.svelte-zowgkf::before{content:"";position:absolute;width:5px;height:5px;top:0;left:50%;background:white;border-radius:100px;transform:translateX(-50%);animation:svelte-zowgkf-scrolldown 2s infinite}@keyframes svelte-zowgkf-scrolldown{0%{transform:translateX(-50%) translateY(10px);opacity:0}50%{opacity:1}100%{transform:translateX(-50%) translateY(30px);opacity:0}}@media screen and (max-width: 800px){.floatingImage.svelte-zowgkf.svelte-zowgkf{width:100vw}.content.svelte-zowgkf.svelte-zowgkf{right:5%;max-width:75%}.brand-container.svelte-zowgkf.svelte-zowgkf{bottom:15%;left:5%}.brand.svelte-zowgkf.svelte-zowgkf{font-weight:900;width:100%;bottom:35%;left:-2px;font-size:0.7em}.brand.svelte-zowgkf p.svelte-zowgkf{-webkit-text-stroke-width:0.2px;letter-spacing:0em}}.dot-bg.svelte-zowgkf.svelte-zowgkf{position:absolute;top:40%;right:0;width:400px;height:150px;background:url("./dot.png");background-size:20px;z-index:-1}.dot-bg1.svelte-zowgkf.svelte-zowgkf{top:20%;left:10%;width:200px;height:380px}.dot-bg2.svelte-zowgkf.svelte-zowgkf{top:20%;right:15%;width:200px;height:300px}',
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script context='module'>\\n\\texport const prerender = true;\\n<\/script>\\n\\n<script>\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\n\\timport { onMount } from 'svelte';\\n\\timport IntersectionObserver from 'svelte-intersection-observer';\\n\\n\\tlet windowScrollY, loading, mainContainer, floatingImage;\\n\\n\\tlet hero1;\\n\\tlet hero2;\\n\\tlet hero3;\\n\\tlet heroText1;\\n\\tlet heroText2;\\n\\tlet heroText3;\\n\\tlet heroText4;\\n\\tlet isHero1Intersecting;\\n\\tlet isHero2Intersecting;\\n\\tlet isHero3Intersecting;\\n\\tlet windowWidth;\\n\\tlet windowHeight;\\n\\tlet rotateImage;\\n\\n\\tconst checkPosition = (e) => {\\n\\t\\tlet x1 = -20 + (e.clientX / innerWidth) * 40;\\n\\t\\tlet x2 = -15 + (e.clientX / innerWidth) * 30;\\n\\t\\tlet x3 = -10 + (e.clientX / innerWidth) * 20;\\n\\t\\tlet x4 = -5 + (e.clientX / innerWidth) * 10;\\n\\n\\t\\t// heroText1.style.transform = \`translateX(\${-x1}px) \`;\\n\\t\\t// heroText2.style.transform = \`translateX(\${-x2}px) \`;\\n\\t\\t// heroText3.style.transform = \`translateX(\${-x3}px) \`;\\n\\t\\t// heroText4.style.transform = \`translateX(\${-x4}px)  \`;\\n\\t};\\n<\/script>\\n\\n<svele:head>\\n\\t<title>Abie G</title>\\n</svele:head>\\n<svelte:window\\n\\tbind:innerWidth={windowWidth}\\n\\tbind:innerHeight={windowHeight}\\n\\tbind:scrollY={windowScrollY}\\n\\ton:mousemove={checkPosition}\\n/>\\n<!-- <svelte:body bind:offsetHeight={documentHeight} /> -->\\n\\n<div class=\\"loading\\" bind:this={loading}>\\n\\t<div class=\\"loadingBar\\" />\\n</div>\\n\\n<!-- <div class=\\"background\\" /> -->\\n<main\\n\\tbind:this={mainContainer}\\n\\tin:fly={{ y: 20, duration: 500 }}\\n\\tout:fly={{ y: 20, duration: 500 }}\\n\\tclass=\\"hero\\"\\n>\\n\\t<div\\n\\t\\tclass=\\"floatingImage\\"\\n\\t\\tstyle=\\"\\n\\t\\t\\t\\tclip-path: polygon({(windowScrollY / 100) * 10}% 0, 100% 0, 100% {100 -\\n\\t\\t\\twindowScrollY / 10}%, {(windowScrollY / 100) * 10}% {100 - windowScrollY / 10}%);\\n\\t\\t\\t\\"\\n\\t>\\n\\t\\t<img bind:this={floatingImage} src=\\"./hero.jpg\\" alt=\\"\\" />\\n\\t</div>\\n\\n\\t<div class=\\"brand-container\\">\\n\\t\\t<div class=\\"brand\\" style=\\"bottom: 60%; opacity: 0.1;\\">\\n\\t\\t\\t<p>ABIEG</p>\\n\\t\\t</div>\\n\\t\\t<div class=\\"brand\\" style=\\"bottom: 45%; opacity: 0.1;\\">\\n\\t\\t\\t<p>ABIEG</p>\\n\\t\\t</div>\\n\\t\\t<div class=\\"brand\\" style=\\"bottom: 15%; opacity: 0.1;\\">\\n\\t\\t\\t<p>ABIEG</p>\\n\\t\\t</div>\\n\\t\\t<div class=\\"brand\\" style=\\"bottom: 0%; opacity: 0.1;\\">\\n\\t\\t\\t<p>ABIEG</p>\\n\\t\\t</div>\\n\\t\\t<div class=\\"brand\\" style=\\"bottom: 30%;\\">\\n\\t\\t\\t<p style=\\"color: #F7749C;\\">ABIEG</p>\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t<div class=\\"content\\">\\n\\t\\t<div class=\\"mouse\\" style=\\"margin-top: {(windowScrollY / 100) * 15}px;\\" />\\n\\t\\t<!-- <p>{height}</p> -->\\n\\t\\t<h3 style=\\"max-width: 450px; width: 100%;\\" class=\\"display-4\\">Join us with Abie G to VIRTUALIZE the world</h3>\\n\\t\\t<p class=\\"lead\\">\\n\\t\\t\\tRegister and get the best out of it\\n\\t\\t</p>\\n\\t\\t<a href=\\"/account\\" class=\\"btn btn-lg btn-primary mt-5 joinButton\\" style=\\"background: #F7749C; border-color:#F7749C; min-width: 200px; width: 30vw;\\">\\n\\t\\t\\tRegister Now\\n\\t\\t</a>\\n\\t</div>\\n\\t<!-- <div bind:this={rec1} class=\\"brand__candy_rec1\\" />\\n\\t\\t<div bind:this={rec2} class=\\"brand__candy_rec2\\" /> -->\\n</main>\\n\\n<IntersectionObserver threshold={0.2} element={hero1} bind:intersecting={isHero1Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero1}\\n\\t\\tstyle={isHero1Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(-10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white my-5\\"\\n\\t>\\n\\t\\t<div class=\\"dot-bg\\" />\\n\\t\\t<div class=\\"container\\">\\n\\t\\t\\t<div class=\\"row row-cols-1 row-cols-lg-2\\">\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-flex d-lg-none\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tbind:this={rotateImage}\\n\\t\\t\\t\\t\\t\\ton:mouseenter={checkPosition}\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5 img-fluid\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-height: 350px;\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_welcome.svg\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col d-flex flex-column justify-content-center text-center text-lg-end\\">\\n\\t\\t\\t\\t\\t<h1 class=\\"display-3\\">ABIE G WEBSITE IS NOW LIVE!!!</h1>\\n\\t\\t\\t\\t\\t<p>\\n\\t\\t\\t\\t\\t\\tIn celebration for hitting the two-million [!!!] follower mark on each of her social\\n\\t\\t\\t\\t\\t\\tmedia accounts, AbieG formally welcomes you (yes, you!) to her namesake website\u2019s\\n\\t\\t\\t\\t\\t\\tribbon-cutting ceremony. Fancy.\\n\\t\\t\\t\\t\\t</p>\\n\\t\\t\\t\\t\\t<a href=\\"/account\\" class=\\"mt-5 btn btn-outline-light \\" style=\\"background: #F7749C; border-color:#F7749C;\\">Register Now</a>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-none d-lg-flex\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tbind:this={rotateImage}\\n\\t\\t\\t\\t\\t\\ton:mousemove={checkPosition}\\n\\t\\t\\t\\t\\t\\ton:focus={checkPosition}\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_welcome.svg\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-width: 400px;\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n<IntersectionObserver threshold={0.2} element={hero2} bind:intersecting={isHero2Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero2}\\n\\t\\tstyle={isHero2Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white my-5\\"\\n\\t>\\n\\t\\t<div class=\\"container\\">\\n\\t\\t\\t<div class=\\"dot-bg dot-bg1\\" />\\n\\t\\t\\t<div class=\\"row row-cols-1 row-cols-lg-2\\">\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-none d-lg-flex\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_add_files.svg\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-height: 350px;\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-flex d-lg-none\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_add_files.svg\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-height: 350px;\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col d-flex flex-column justify-content-center text-center text-lg-start\\">\\n\\t\\t\\t\\t\\t<h1 class=\\"display-3\\">Abie G Community Moderators</h1>\\n\\t\\t\\t\\t\\t<p>\\n\\t\\t\\t\\t\\t\\tTo ensure a safe space for the community members, this site is regularly kept in check\\n\\t\\t\\t\\t\\t\\tby the moderators. Inappropriate conducts are strictly discouraged and violation to\\n\\t\\t\\t\\t\\t\\tcommunity rules may result to account suspension and/or removal.\\n\\t\\t\\t\\t\\t</p>\\n\\t\\t\\t\\t\\t<p>Just be active and you might be our next moderator</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n<IntersectionObserver threshold={0.2} element={hero3} bind:intersecting={isHero3Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero3}\\n\\t\\tstyle={isHero3Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(-10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white my-5\\"\\n\\t>\\n\\t\\t<div class=\\"container\\">\\n\\t\\t\\t<div class=\\"row row-cols-1 row-cols-lg-2\\">\\n\\t\\t\\t\\t<div class=\\"dot-bg dot-bg2\\" />\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-flex d-lg-none\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_say_hello.svg\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-height: 350px;\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col d-flex flex-column justify-content-center text-center text-lg-end\\">\\n\\t\\t\\t\\t\\t<h1 class=\\"display-3\\">Connect with Abie G with exclusive content</h1>\\n\\t\\t\\t\\t\\t<p>\\n\\t\\t\\t\\t\\t\\tThis site takes BabieGs to a much more intimate interaction with AbieG herself as she\\n\\t\\t\\t\\t\\t\\tshares with them glimpses of her everyday life, ambitions, and aspirations as well as\\n\\t\\t\\t\\t\\t\\tsite-exclusive giveaways and surprises.\\n\\t\\t\\t\\t\\t</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"col justify-content-center mt-5 d-none d-lg-flex\\">\\n\\t\\t\\t\\t\\t<img\\n\\t\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_handcrafts_say_hello.svg\\"\\n\\t\\t\\t\\t\\t\\tstyle=\\"max-height: 350px;\\"\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n\\n<!-- for maintenance -->\\n\\n<!-- <main style=\\"display: flex; align-items:center;\\">\\n\\t\\t<div class=\\"container white-text\\">\\n\\t\\t\\t<h1>Sorry, we are fixing or updating something</h1>\\n\\t\\t\\t<p>Please come back in some time</p>\\n\\t\\t</div>\\n\\t</main> -->\\n<style lang=\\"scss\\">@import url(\\"https://fonts.googleapis.com/css2?family=Righteous&display=swap\\");\\n.loading {\\n  position: fixed;\\n}\\n\\n.floatingImage {\\n  position: fixed;\\n  width: 50vw;\\n  height: 100vh;\\n  right: 0;\\n  display: flex;\\n  justify-content: center;\\n  align-items: center;\\n  z-index: 2;\\n}\\n.floatingImage img {\\n  width: 100%;\\n  height: 100%;\\n  opacity: 0.7;\\n  object-fit: cover;\\n}\\n\\n.hero {\\n  /* margin: 0; */\\n  position: relative;\\n  min-height: 100vh;\\n  z-index: 3;\\n}\\n.hero:first-child {\\n  bottom: 10%;\\n}\\n\\n.joinButton {\\n  transition: all 0.2s ease;\\n}\\n\\n.joinButton:hover {\\n  transform: scale(1.05);\\n}\\n\\n.joinButton:active {\\n  transition: all 0s ease;\\n  transform: scale(1);\\n}\\n\\nmain {\\n  transition: 500ms ease all;\\n  min-height: 70vh;\\n  perspective: 2000px;\\n  user-select: none;\\n  background: transparent;\\n}\\n\\n.brand-container {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  z-index: 1;\\n}\\n\\n.brand {\\n  position: absolute;\\n  bottom: 35%;\\n  left: 25px;\\n  width: 100%;\\n  overflow: hidden;\\n}\\n.brand p {\\n  color: transparent;\\n  font-weight: 600;\\n  font-family: \\"Righteous\\", cursive;\\n  font-size: 10em;\\n  -webkit-text-stroke-width: 0.5px;\\n  -webkit-text-stroke-color: white;\\n  transition: opacity 200ms ease;\\n  letter-spacing: 0.2em;\\n}\\n\\n.content {\\n  position: absolute;\\n  right: 5%;\\n  bottom: 20%;\\n  color: white;\\n  z-index: 2;\\n  text-align: right;\\n}\\n\\n.mouse {\\n  position: fixed;\\n  left: calc(50% - 20px);\\n  top: 90vh;\\n  width: 40px;\\n  height: 65px;\\n  border-radius: 100px;\\n  border: solid white 3px;\\n  z-index: 9;\\n}\\n.mouse::before {\\n  content: \\"\\";\\n  position: absolute;\\n  width: 5px;\\n  height: 5px;\\n  top: 0;\\n  left: 50%;\\n  background: white;\\n  border-radius: 100px;\\n  transform: translateX(-50%);\\n  animation: scrolldown 2s infinite;\\n}\\n@keyframes scrolldown {\\n  0% {\\n    transform: translateX(-50%) translateY(10px);\\n    opacity: 0;\\n  }\\n  50% {\\n    opacity: 1;\\n  }\\n  100% {\\n    transform: translateX(-50%) translateY(30px);\\n    opacity: 0;\\n  }\\n}\\n\\n@media screen and (max-width: 800px) {\\n  .floatingImage {\\n    width: 100vw;\\n  }\\n\\n  .content {\\n    right: 5%;\\n    max-width: 75%;\\n  }\\n\\n  .brand-container {\\n    bottom: 15%;\\n    left: 5%;\\n  }\\n\\n  .brand {\\n    font-weight: 900;\\n    width: 100%;\\n    bottom: 35%;\\n    left: -2px;\\n    font-size: 0.7em;\\n  }\\n  .brand p {\\n    -webkit-text-stroke-width: 0.2px;\\n    letter-spacing: 0em;\\n  }\\n}\\n.dot-bg {\\n  position: absolute;\\n  top: 40%;\\n  right: 0;\\n  width: 400px;\\n  height: 150px;\\n  background: url(\\"./dot.png\\");\\n  background-size: 20px;\\n  z-index: -1;\\n}\\n\\n.dot-bg1 {\\n  top: 20%;\\n  left: 10%;\\n  width: 200px;\\n  height: 380px;\\n}\\n\\n.dot-bg2 {\\n  top: 20%;\\n  right: 15%;\\n  width: 200px;\\n  height: 300px;\\n}</style>\\n"],"names":[],"mappings":"AA4OmB,QAAQ,IAAI,iEAAiE,CAAC,CAAC,AAClG,QAAQ,4BAAC,CAAC,AACR,QAAQ,CAAE,KAAK,AACjB,CAAC,AAED,cAAc,4BAAC,CAAC,AACd,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,4BAAc,CAAC,GAAG,cAAC,CAAC,AAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,KAAK,4BAAC,CAAC,AAEL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,iCAAK,YAAY,AAAC,CAAC,AACjB,MAAM,CAAE,GAAG,AACb,CAAC,AAED,WAAW,4BAAC,CAAC,AACX,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IAAI,AAC3B,CAAC,AAED,uCAAW,MAAM,AAAC,CAAC,AACjB,SAAS,CAAE,MAAM,IAAI,CAAC,AACxB,CAAC,AAED,uCAAW,OAAO,AAAC,CAAC,AAClB,UAAU,CAAE,GAAG,CAAC,EAAE,CAAC,IAAI,CACvB,SAAS,CAAE,MAAM,CAAC,CAAC,AACrB,CAAC,AAED,IAAI,4BAAC,CAAC,AACJ,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,UAAU,CAAE,IAAI,CAChB,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,WAAW,AACzB,CAAC,AAED,gBAAgB,4BAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,MAAM,4BAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,MAAM,AAClB,CAAC,AACD,oBAAM,CAAC,CAAC,cAAC,CAAC,AACR,KAAK,CAAE,WAAW,CAClB,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,WAAW,CAAC,CAAC,OAAO,CACjC,SAAS,CAAE,IAAI,CACf,yBAAyB,CAAE,KAAK,CAChC,yBAAyB,CAAE,KAAK,CAChC,UAAU,CAAE,OAAO,CAAC,KAAK,CAAC,IAAI,CAC9B,cAAc,CAAE,KAAK,AACvB,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,EAAE,CACT,MAAM,CAAE,GAAG,CACX,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,MAAM,4BAAC,CAAC,AACN,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,CACtB,GAAG,CAAE,IAAI,CACT,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,KAAK,CACpB,MAAM,CAAE,KAAK,CAAC,KAAK,CAAC,GAAG,CACvB,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,kCAAM,QAAQ,AAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,GAAG,CACT,UAAU,CAAE,KAAK,CACjB,aAAa,CAAE,KAAK,CACpB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,SAAS,CAAE,wBAAU,CAAC,EAAE,CAAC,QAAQ,AACnC,CAAC,AACD,WAAW,wBAAW,CAAC,AACrB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,WAAW,IAAI,CAAC,CAC5C,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,GAAG,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,AACZ,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,WAAW,IAAI,CAAC,CAC5C,OAAO,CAAE,CAAC,AACZ,CAAC,AACH,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACpC,cAAc,4BAAC,CAAC,AACd,KAAK,CAAE,KAAK,AACd,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,KAAK,CAAE,EAAE,CACT,SAAS,CAAE,GAAG,AAChB,CAAC,AAED,gBAAgB,4BAAC,CAAC,AAChB,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,EAAE,AACV,CAAC,AAED,MAAM,4BAAC,CAAC,AACN,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,SAAS,CAAE,KAAK,AAClB,CAAC,AACD,oBAAM,CAAC,CAAC,cAAC,CAAC,AACR,yBAAyB,CAAE,KAAK,CAChC,cAAc,CAAE,GAAG,AACrB,CAAC,AACH,CAAC,AACD,OAAO,4BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,CAAC,CACR,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,UAAU,CAAE,IAAI,WAAW,CAAC,CAC5B,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,EAAE,AACb,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACf,CAAC,AAED,QAAQ,4BAAC,CAAC,AACR,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,GAAG,CACV,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACf,CAAC"}`
};
var prerender$2 = true;
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let windowScrollY, loading, mainContainer, floatingImage;
  let hero1;
  let hero2;
  let hero3;
  let isHero1Intersecting;
  let isHero2Intersecting;
  let isHero3Intersecting;
  let rotateImage;
  $$result.css.add(css$h);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<svele:head><title>Abie G</title></svele:head>



<div class="${"loading svelte-zowgkf"}"${add_attribute("this", loading, 0)}><div class="${"loadingBar"}"></div></div>


<main class="${"hero svelte-zowgkf"}"${add_attribute("this", mainContainer, 0)}><div class="${"floatingImage svelte-zowgkf"}" style="${"clip-path: polygon(" + escape(windowScrollY / 100 * 10) + "% 0, 100% 0, 100% " + escape(100 - windowScrollY / 10) + "%, " + escape(windowScrollY / 100 * 10) + "% " + escape(100 - windowScrollY / 10) + "%);"}"><img src="${"./hero.jpg"}" alt="${""}" class="${"svelte-zowgkf"}"${add_attribute("this", floatingImage, 0)}></div>

	<div class="${"brand-container svelte-zowgkf"}"><div class="${"brand svelte-zowgkf"}" style="${"bottom: 60%; opacity: 0.1;"}"><p class="${"svelte-zowgkf"}">ABIEG</p></div>
		<div class="${"brand svelte-zowgkf"}" style="${"bottom: 45%; opacity: 0.1;"}"><p class="${"svelte-zowgkf"}">ABIEG</p></div>
		<div class="${"brand svelte-zowgkf"}" style="${"bottom: 15%; opacity: 0.1;"}"><p class="${"svelte-zowgkf"}">ABIEG</p></div>
		<div class="${"brand svelte-zowgkf"}" style="${"bottom: 0%; opacity: 0.1;"}"><p class="${"svelte-zowgkf"}">ABIEG</p></div>
		<div class="${"brand svelte-zowgkf"}" style="${"bottom: 30%;"}"><p style="${"color: #F7749C;"}" class="${"svelte-zowgkf"}">ABIEG</p></div></div>

	<div class="${"content svelte-zowgkf"}"><div class="${"mouse svelte-zowgkf"}" style="${"margin-top: " + escape(windowScrollY / 100 * 15) + "px;"}"></div>
		
		<h3 style="${"max-width: 450px; width: 100%;"}" class="${"display-4"}">Join us with Abie G to VIRTUALIZE the world</h3>
		<p class="${"lead"}">Register and get the best out of it
		</p>
		<a href="${"/account"}" class="${"btn btn-lg btn-primary mt-5 joinButton svelte-zowgkf"}" style="${"background: #F7749C; border-color:#F7749C; min-width: 200px; width: 30vw;"}">Register Now
		</a></div>
	</main>

${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
      threshold: 0.2,
      element: hero1,
      intersecting: isHero1Intersecting
    }, {
      intersecting: ($$value) => {
        isHero1Intersecting = $$value;
        $$settled = false;
      }
    }, {
      default: () => `<main${add_attribute("style", isHero1Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(-10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 svelte-zowgkf"}"${add_attribute("this", hero1, 0)}><div class="${"dot-bg svelte-zowgkf"}"></div>
		<div class="${"container"}"><div class="${"row row-cols-1 row-cols-lg-2"}"><div class="${"col justify-content-center mt-5 d-flex d-lg-none"}"><img class="${"mb-5 img-fluid"}" style="${"max-height: 350px;"}" src="${"./illustrations/undraw_handcrafts_welcome.svg"}" alt="${""}"${add_attribute("this", rotateImage, 0)}></div>
				<div class="${"col d-flex flex-column justify-content-center text-center text-lg-end"}"><h1 class="${"display-3"}">ABIE G WEBSITE IS NOW LIVE!!!</h1>
					<p>In celebration for hitting the two-million [!!!] follower mark on each of her social
						media accounts, AbieG formally welcomes you (yes, you!) to her namesake website\u2019s
						ribbon-cutting ceremony. Fancy.
					</p>
					<a href="${"/account"}" class="${"mt-5 btn btn-outline-light "}" style="${"background: #F7749C; border-color:#F7749C;"}">Register Now</a></div>
				<div class="${"col justify-content-center mt-5 d-none d-lg-flex"}"><img class="${"mb-5"}" src="${"./illustrations/undraw_handcrafts_welcome.svg"}" style="${"max-width: 400px;"}" alt="${""}"${add_attribute("this", rotateImage, 0)}></div></div></div></main>`
    })}
${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
      threshold: 0.2,
      element: hero2,
      intersecting: isHero2Intersecting
    }, {
      intersecting: ($$value) => {
        isHero2Intersecting = $$value;
        $$settled = false;
      }
    }, {
      default: () => `<main${add_attribute("style", isHero2Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 svelte-zowgkf"}"${add_attribute("this", hero2, 0)}><div class="${"container"}"><div class="${"dot-bg dot-bg1 svelte-zowgkf"}"></div>
			<div class="${"row row-cols-1 row-cols-lg-2"}"><div class="${"col justify-content-center mt-5 d-none d-lg-flex"}"><img class="${"mb-5"}" src="${"./illustrations/undraw_handcrafts_add_files.svg"}" style="${"max-height: 350px;"}" alt="${""}"></div>
				<div class="${"col justify-content-center mt-5 d-flex d-lg-none"}"><img class="${"mb-5"}" src="${"./illustrations/undraw_handcrafts_add_files.svg"}" style="${"max-height: 350px;"}" alt="${""}"></div>
				<div class="${"col d-flex flex-column justify-content-center text-center text-lg-start"}"><h1 class="${"display-3"}">Abie G Community Moderators</h1>
					<p>To ensure a safe space for the community members, this site is regularly kept in check
						by the moderators. Inappropriate conducts are strictly discouraged and violation to
						community rules may result to account suspension and/or removal.
					</p>
					<p>Just be active and you might be our next moderator</p></div></div></div></main>`
    })}
${validate_component(IntersectionObserver_1, "IntersectionObserver").$$render($$result, {
      threshold: 0.2,
      element: hero3,
      intersecting: isHero3Intersecting
    }, {
      intersecting: ($$value) => {
        isHero3Intersecting = $$value;
        $$settled = false;
      }
    }, {
      default: () => `<main${add_attribute("style", isHero3Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(-10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 svelte-zowgkf"}"${add_attribute("this", hero3, 0)}><div class="${"container"}"><div class="${"row row-cols-1 row-cols-lg-2"}"><div class="${"dot-bg dot-bg2 svelte-zowgkf"}"></div>
				<div class="${"col justify-content-center mt-5 d-flex d-lg-none"}"><img class="${"mb-5"}" src="${"./illustrations/undraw_handcrafts_say_hello.svg"}" style="${"max-height: 350px;"}" alt="${""}"></div>
				<div class="${"col d-flex flex-column justify-content-center text-center text-lg-end"}"><h1 class="${"display-3"}">Connect with Abie G with exclusive content</h1>
					<p>This site takes BabieGs to a much more intimate interaction with AbieG herself as she
						shares with them glimpses of her everyday life, ambitions, and aspirations as well as
						site-exclusive giveaways and surprises.
					</p></div>
				<div class="${"col justify-content-center mt-5 d-none d-lg-flex"}"><img class="${"mb-5"}" src="${"./illustrations/undraw_handcrafts_say_hello.svg"}" style="${"max-height: 350px;"}" alt="${""}"></div></div></div></main>`
    })}



`;
  } while (!$$settled);
  return $$rendered;
});
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  prerender: prerender$2
});
var css$g = {
  code: 'main.svelte-pssvbk{position:relative;margin-top:120px;height:100vh;z-index:3}.scroller.svelte-pssvbk{width:100vw;position:absolute;top:0%;left:0%;color:white;opacity:0.1;font-size:5rem;font-family:"Thunder Bold";user-select:none;z-index:-10}',
  map: `{"version":3,"file":"account.svelte","sources":["account.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, slide } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\timport { supabase, global_account, global_hasAccount, global_account_data } from '../global';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\timport toastify from 'toastify-js';\\r\\n\\timport 'toastify-js/src/toastify.css';\\r\\n\\r\\n\\tlet isRegister = false;\\r\\n\\tlet isBirthdateMatched = true;\\r\\n\\tlet confirmLogout = false;\\r\\n\\tlet login_email;\\r\\n\\tlet login_password;\\r\\n\\tlet reg_email = '';\\r\\n\\tlet reg_password = '';\\r\\n\\tlet reg_givenName = '';\\r\\n\\tlet reg_birthdate = '';\\r\\n\\tlet reg_familyName = '';\\r\\n\\tlet reg_gender = 'Male';\\r\\n\\tlet reg_address = '';\\r\\n\\tlet isLoggingIn = false;\\r\\n\\r\\n\\tlet birthdateMask = /^(0[1-9]|1[0-2])\\\\/(0[1-9]|1\\\\d|2\\\\d|3[01])\\\\/(19|20)\\\\d{2}$/;\\r\\n\\r\\n\\tconst changeBirthdate = (e) => {\\r\\n\\t\\tbirthdateMask.test(reg_birthdate) ? (isBirthdateMatched = true) : (isBirthdateMatched = false);\\r\\n\\t};\\r\\n\\r\\n\\tconst toggleCards = (e) => {\\r\\n\\t\\tisRegister ? (isRegister = false) : (isRegister = true);\\r\\n\\t};\\r\\n\\r\\n\\tconst login_emailPass = async (e) => {\\r\\n\\t\\tif (login_email && login_password) {\\r\\n\\t\\t\\tisLoggingIn = true;\\r\\n\\t\\t\\tconst { user, error } = await supabase.auth.signIn({\\r\\n\\t\\t\\t\\temail: login_email,\\r\\n\\t\\t\\t\\tpassword: login_password\\r\\n\\t\\t\\t});\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\tlet { data: users, thiserror } = await supabase.from('users').select('*').eq('id', user.id);\\r\\n\\t\\t\\t\\tif (!thiserror) {\\r\\n\\t\\t\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\t\\t\\ttext: \`Hello \${login_email.split('@')[0]}\`,\\r\\n\\t\\t\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\t\\t\\tbackground: '#06d6a0',\\r\\n\\t\\t\\t\\t\\t\\t\\tcolor: '#212529'\\r\\n\\t\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t\\t}).showToast();\\r\\n\\t\\t\\t\\t\\tglobal_account.set(user);\\r\\n\\t\\t\\t\\t\\tglobal_account_data.set(users[0]);\\r\\n\\t\\t\\t\\t\\tisLoggingIn = false;\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\tisLoggingIn = false;\\r\\n\\t\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\t\\ttext: 'Incorrect Email or Password',\\r\\n\\t\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\t\\tbackground: '#ef476f'\\r\\n\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t}).showToast();\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tisLoggingIn = false;\\r\\n\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\ttext: \`Please fill all the required fields\`,\\r\\n\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\tbackground: '#ef476f'\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}).showToast();\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tconst registerUser = async (e) => {\\r\\n\\t\\tif (\\r\\n\\t\\t\\treg_email != '' &&\\r\\n\\t\\t\\treg_password != '' &&\\r\\n\\t\\t\\treg_givenName != '' &&\\r\\n\\t\\t\\treg_familyName != '' &&\\r\\n\\t\\t\\treg_gender != '' &&\\r\\n\\t\\t\\treg_address != '' &&\\r\\n\\t\\t\\tisBirthdateMatched &&\\r\\n\\t\\t\\tdayjs().diff(reg_birthdate, 'year') > 18\\r\\n\\t\\t) {\\r\\n\\t\\t\\tisRegister = false;\\r\\n\\t\\t\\tlet { user, error } = await supabase.auth.signUp({\\r\\n\\t\\t\\t\\temail: reg_email,\\r\\n\\t\\t\\t\\tpassword: reg_password\\r\\n\\t\\t\\t});\\r\\n\\t\\t\\tlet { data: users, thiserror } = await supabase.from('users').insert([\\r\\n\\t\\t\\t\\t{\\r\\n\\t\\t\\t\\t\\temail: reg_email,\\r\\n\\t\\t\\t\\t\\tid: user.id,\\r\\n\\t\\t\\t\\t\\tgiven_name: reg_givenName,\\r\\n\\t\\t\\t\\t\\tfamily_name: reg_familyName,\\r\\n\\t\\t\\t\\t\\tbirthdate: reg_birthdate,\\r\\n\\t\\t\\t\\t\\tgender: reg_gender,\\r\\n\\t\\t\\t\\t\\tshipping_address: reg_address\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t]);\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\tif (!thiserror && users) {\\r\\n\\t\\t\\t\\t\\tlogin_email = reg_email;\\r\\n\\t\\t\\t\\t\\tisRegister = false;\\r\\n\\t\\t\\t\\t\\treg_gender = null;\\r\\n\\t\\t\\t\\t\\treg_givenName = null;\\r\\n\\t\\t\\t\\t\\treg_familyName = null;\\r\\n\\t\\t\\t\\t\\treg_birthdate = null;\\r\\n\\t\\t\\t\\t\\treg_address = null;\\r\\n\\t\\t\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\t\\t\\ttext: \`You are now registered. Please check your email\`,\\r\\n\\t\\t\\t\\t\\t\\tduration: 4000,\\r\\n\\t\\t\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\t\\t\\tbackground: '#06d6a0',\\r\\n\\t\\t\\t\\t\\t\\t\\tcolor: '#212529'\\r\\n\\t\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t\\t}).showToast();\\r\\n\\t\\t\\t\\t} else {\\r\\n\\t\\t\\t\\t\\tconsole.log(thiserror);\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\tconsole.log(error);\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\ttext: \`Please fill all the required fields\`,\\r\\n\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\tbackground: '#ef476f'\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}).showToast();\\r\\n\\t\\t}\\r\\n\\t\\tif (dayjs().diff(reg_birthdate, 'year') < 18) {\\r\\n\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\ttext: \`You should be at least 18 years old to register\`,\\r\\n\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\tbackground: '#ef476f'\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}).showToast();\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tconst logout = async (e) => {\\r\\n\\t\\tconst { error } = await supabase.auth.signOut();\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tglobal_account.set(null);\\r\\n\\t\\t\\tglobal_account_data.set(null);\\r\\n\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\ttext: \`You have been logged out\`,\\r\\n\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\tbackground: '#002B36'\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}).showToast();\\r\\n\\t\\t}\\r\\n\\t\\tconfirmLogout = false;\\r\\n\\t};\\r\\n\\tconst logoutConfirm = (e) => {\\r\\n\\t\\tif (confirmLogout) {\\r\\n\\t\\t\\tconfirmLogout = false;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tconfirmLogout = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet thisUser = await supabase.auth.user();\\r\\n\\t\\tif (thisUser) {\\r\\n\\t\\t\\tlet { data: users, error } = await supabase.from('users').select('*').eq('id', thisUser.id);\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\tglobal_account.set(thisUser);\\r\\n\\t\\t\\t\\tglobal_account_data.set(users[0]);\\r\\n\\t\\t\\t}\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>Accounts | Abie G</title>\\r\\n</svele:head>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>\\r\\n\\t<div class=\\"container text-white\\" style=\\"border-radius:10px\\">\\r\\n\\t\\t<p class=\\"display-3\\">Your Account</p>\\r\\n\\t\\t{#if !$global_account}\\r\\n\\t\\t\\t<div class=\\"row \\" style=\\"min-height: 50vh;\\" in:fly|local={{ y: -40, duration: 500 }}>\\r\\n\\t\\t\\t\\t<div class=\\"col-md-6 d-flex justify-content-center align-items-center mt-md-5\\">\\r\\n\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"mx-auto\\"\\r\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/watermelon/watermelon-pack-illustration-08.svg\\"\\r\\n\\t\\t\\t\\t\\t\\twidth=\\"250\\"\\r\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"col-md-6 d-flex flex-column justify-content-center mt-md-5\\">\\r\\n\\t\\t\\t\\t\\t<h4>Sign in to your account</h4>\\r\\n\\r\\n\\t\\t\\t\\t\\t<div class=\\"form-floating my-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"login_email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Registered Email Address\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={login_email}\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"login_email\\">Your Registered Email Address*</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"form-floating mb-4 \\">\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"login_password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={login_password}\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"login_password\\">Your Password*</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-primary\\"\\r\\n\\t\\t\\t\\t\\t\\tdisabled={isLoggingIn ? true : false}\\r\\n\\t\\t\\t\\t\\t\\ton:click={login_emailPass}\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t{#if isLoggingIn}\\r\\n\\t\\t\\t\\t\\t\\t\\t<span\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"spinner-border spinner-border-sm me-3\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\trole=\\"status\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\taria-hidden=\\"true\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\tLogging In...\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t{#if !isLoggingIn}\\r\\n\\t\\t\\t\\t\\t\\t\\tLog In\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t<button on:click={toggleCards} class=\\"btn btn-link mt-3 text-info\\"\\r\\n\\t\\t\\t\\t\\t\\t>Don't have an account? Click Me</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t{#if isRegister}\\r\\n\\t\\t\\t\\t<div class=\\"row my-5\\" transition:slide|local={{ duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t<h4>Join with us</h4>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-12 mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t<h5>User Account</h5>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"username@domain.com\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_email}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_email\\">Your Email address*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Secure Password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_password}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_password\\">Your Password*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-sm-12 mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t<h5>Basic Information</h5>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_givenName\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Given Name\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_givenName}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_givenName\\">Your Given Name*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_familyName\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Surname\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_familyName}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_familyName\\">Your Surname*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_address\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Shipping Addresse\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_address}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_address\\">Your Shipping Address*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6 mb-4\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass={isBirthdateMatched\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t? 'form-control bg-transparent text-white'\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t: 'form-control bg-transparent text-white border-danger'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_birthdate\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Birthdate\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_birthdate}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ton:input={changeBirthdate}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_birthdate\\">Birthdate*</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<p>*format follows MM/DD/YYYY</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<p>*i.e. 12/14/1998</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div><h5>Gender*</h5></div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"Male\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender1\\"> Male </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"Female\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender2\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender2\\"> Female </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"Non-Binary\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender3\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender3\\"> Non-binary </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<button on:click={registerUser} class=\\"btn btn-outline-primary mt-5\\">\\r\\n\\t\\t\\t\\t\\t\\tRegister Now\\r\\n\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t{/if}\\r\\n\\r\\n\\t\\t<!-- account details -->\\r\\n\\t\\t{#if $global_account_data && $global_account.aud === 'authenticated'}\\r\\n\\t\\t\\t<div class=\\"row mt-5\\" in:fly|local={{ y: -20, duration: 500 }}>\\r\\n\\t\\t\\t\\t<div class=\\"col-12 col-md-6 text-center mb-5\\">\\r\\n\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\tsrc=\\"https://ui-avatars.com/api/?name={$global_account_data.given_name}+{$global_account_data.family_name}&background=F7749C&color=fff\\"\\r\\n\\t\\t\\t\\t\\t\\talt=\\"User Avatar\\"\\r\\n\\t\\t\\t\\t\\t\\twidth=\\"150\\"\\r\\n\\t\\t\\t\\t\\t\\tstyle=\\"border-radius: 100%;\\"\\r\\n\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t<p class=\\"display-6 mt-2 mb-0\\">\\r\\n\\t\\t\\t\\t\\t\\t{$global_account_data.given_name}\\r\\n\\t\\t\\t\\t\\t\\t{$global_account_data.family_name}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"mb-0 mt-2\\">\\r\\n\\t\\t\\t\\t\\t\\t{$global_account.email}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"text-muted mt-0\\">\\r\\n\\t\\t\\t\\t\\t\\t{$global_account.id.toUpperCase()}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead\\">\\r\\n\\t\\t\\t\\t\\t\\t<span class=\\"text-muted me-3\\"> Birthdate </span>\\r\\n\\t\\t\\t\\t\\t\\t{dayjs($global_account_data.birthdate).format('MMMM D YYYY')}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead\\">\\r\\n\\t\\t\\t\\t\\t\\t<span class=\\"text-muted me-3\\"> Gender </span>\\r\\n\\t\\t\\t\\t\\t\\t{$global_account_data.gender}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead text-muted mb-0 mt-4\\">Shipping Address</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead mt-0\\">\\r\\n\\t\\t\\t\\t\\t\\t{$global_account_data.shipping_address}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t<div class=\\"col-12 col-md-6 text-center d-flex flex-column justify-content-center\\">\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead text-muted mb-0 mt-4\\">Account Type</p>\\r\\n\\t\\t\\t\\t\\t<p class=\\"lead mt-0 mb-5\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if $global_account_data.isModerator}\\r\\n\\t\\t\\t\\t\\t\\t\\tModerator Account\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if $global_account_data.isAdmin}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/ Root Account\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\tStandard Account\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if $global_account_data.isAdmin}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/ Root Account\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t{#if $global_account_data.isModerator}\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-link\\"\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tgoto('/admin/dashboard');\\r\\n\\t\\t\\t\\t\\t\\t\\t}}>Go to Dashboard</button\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{:else}<button class=\\"btn btn-link\\" disabled>Request Moderator Account</button>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t{#if $global_account_data.isAdmin}\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-link\\"\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tgoto('/root');\\r\\n\\t\\t\\t\\t\\t\\t\\t}}>Go to Root Dashboard</button\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t<div class=\\"row mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if !confirmLogout}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"d-flex justify-content-around\\" transition:slide|local={{ duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-danger\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ton:click={logoutConfirm}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"min-width: 150px; width: 50%\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tLog out\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t<h4 transition:slide|local={{ duration: 500 }} class=\\"text-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tDo you really want to log out\\r\\n\\t\\t\\t\\t\\t\\t\\t</h4>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div transition:slide|local={{ duration: 500 }} class=\\"btn-group\\" role=\\"group\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<button type=\\"button\\" on:click={logout} class=\\"btn btn-outline-danger\\">Yes</button>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<button type=\\"button\\" on:click={logoutConfirm} class=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>No</button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n\\t<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t\\t>BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;</MarqueeTextWidget\\r\\n\\t\\t>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 120px;\\n  height: 100vh;\\n  z-index: 3;\\n}\\n\\n/* .container1 {\\n\\tpadding: 1em;\\n\\tpadding-top: 2em;\\n\\tpadding-bottom: 2em;\\n\\tborder-radius: 10px;\\n} */\\n.scroller {\\n  width: 100vw;\\n  position: absolute;\\n  top: 0%;\\n  left: 0%;\\n  color: white;\\n  opacity: 0.1;\\n  font-size: 5rem;\\n  font-family: \\"Thunder Bold\\";\\n  user-select: none;\\n  z-index: -10;\\n}</style>\\r\\n"],"names":[],"mappings":"AAufmB,IAAI,cAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,CAAC,AACZ,CAAC,AAQD,SAAS,cAAC,CAAC,AACT,KAAK,CAAE,KAAK,CACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,EAAE,CACP,IAAI,CAAE,EAAE,CACR,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,AACd,CAAC"}`
};
var Account = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $global_account, $$unsubscribe_global_account;
  let $global_account_data, $$unsubscribe_global_account_data;
  $$unsubscribe_global_account = subscribe(global_account, (value) => $global_account = value);
  $$unsubscribe_global_account_data = subscribe(global_account_data, (value) => $global_account_data = value);
  let login_email;
  let login_password;
  $$result.css.add(css$g);
  $$unsubscribe_global_account();
  $$unsubscribe_global_account_data();
  return `<svele:head><title>Accounts | Abie G</title></svele:head>

<main class="${"svelte-pssvbk"}"><div class="${"container text-white"}" style="${"border-radius:10px"}"><p class="${"display-3"}">Your Account</p>
		${!$global_account ? `<div class="${"row "}" style="${"min-height: 50vh;"}"><div class="${"col-md-6 d-flex justify-content-center align-items-center mt-md-5"}"><img class="${"mx-auto"}" src="${"./illustrations/watermelon/watermelon-pack-illustration-08.svg"}" width="${"250"}" alt="${""}"></div>
				<div class="${"col-md-6 d-flex flex-column justify-content-center mt-md-5"}"><h4>Sign in to your account</h4>

					<div class="${"form-floating my-3 "}"><input type="${"email"}" class="${"form-control bg-transparent text-white"}" id="${"login_email"}" placeholder="${"Your Registered Email Address"}"${add_attribute("value", login_email, 0)}>
						<label for="${"login_email"}">Your Registered Email Address*</label></div>
					<div class="${"form-floating mb-4 "}"><input type="${"password"}" class="${"form-control bg-transparent text-white"}" id="${"login_password"}" placeholder="${"Your Password"}"${add_attribute("value", login_password, 0)}>
						<label for="${"login_password"}">Your Password*</label></div>
					<button class="${"btn btn-primary"}" ${""}>${``}
						${`Log In`}</button>
					<button class="${"btn btn-link mt-3 text-info"}">Don&#39;t have an account? Click Me</button></div></div>

			${``}` : ``}

		
		${$global_account_data && $global_account.aud === "authenticated" ? `<div class="${"row mt-5"}"><div class="${"col-12 col-md-6 text-center mb-5"}"><img src="${"https://ui-avatars.com/api/?name=" + escape($global_account_data.given_name) + "+" + escape($global_account_data.family_name) + "&background=F7749C&color=fff"}" alt="${"User Avatar"}" width="${"150"}" style="${"border-radius: 100%;"}">
					<p class="${"display-6 mt-2 mb-0"}">${escape($global_account_data.given_name)}
						${escape($global_account_data.family_name)}</p>
					<p class="${"mb-0 mt-2"}">${escape($global_account.email)}</p>
					<p class="${"text-muted mt-0"}">${escape($global_account.id.toUpperCase())}</p>
					<p class="${"lead"}"><span class="${"text-muted me-3"}">Birthdate </span>
						${escape((0, import_dayjs.default)($global_account_data.birthdate).format("MMMM D YYYY"))}</p>
					<p class="${"lead"}"><span class="${"text-muted me-3"}">Gender </span>
						${escape($global_account_data.gender)}</p>
					<p class="${"lead text-muted mb-0 mt-4"}">Shipping Address</p>
					<p class="${"lead mt-0"}">${escape($global_account_data.shipping_address)}</p></div>

				<div class="${"col-12 col-md-6 text-center d-flex flex-column justify-content-center"}"><p class="${"lead text-muted mb-0 mt-4"}">Account Type</p>
					<p class="${"lead mt-0 mb-5"}">${$global_account_data.isModerator ? `Moderator Account

							${$global_account_data.isAdmin ? `/ Root Account` : ``}` : `Standard Account
							${$global_account_data.isAdmin ? `/ Root Account` : ``}`}</p>
					${$global_account_data.isModerator ? `<button class="${"btn btn-link"}">Go to Dashboard</button>` : `<button class="${"btn btn-link"}" disabled>Request Moderator Account</button>`}
					${$global_account_data.isAdmin ? `<button class="${"btn btn-link"}">Go to Root Dashboard</button>` : ``}
					<div class="${"row mt-4"}">${`<div class="${"d-flex justify-content-around"}"><button class="${"btn btn-danger"}" style="${"min-width: 150px; width: 50%"}">Log out
								</button></div>`}</div></div></div>` : ``}</div>
	<div class="${"scroller svelte-pssvbk"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `BE ACTIVE WITH ABIE G \xA0BE ACTIVE WITH ABIE G \xA0BE ACTIVE WITH ABIE G \xA0`
  })}</div>
</main>`;
});
var account = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Account
});
var css$f = {
  code: "main.svelte-vwfhd{position:relative;min-height:100vh;margin-top:120px;z-index:3}.scroller.svelte-vwfhd{width:100vw;position:absolute;top:0%;left:0%;color:white;opacity:0.1;font-size:5rem;font-family:'Thunder Bold';user-select:none;z-index:-10}",
  map: `{"version":3,"file":"contact.svelte","sources":["contact.svelte"],"sourcesContent":["<script context='module'>\\r\\n\\texport const prerender = true;\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\timport { fly, fade } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>Connect With Us | Abie G</title>\\r\\n</svele:head>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>\\r\\n\\t<div class=\\"container text-white\\">\\r\\n\\t\\t<p class=\\"display-3\\">Connect with us</p>\\r\\n\\t\\t<div class=\\"row mt-5\\">\\r\\n\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t<h3>Write your thoughts</h3>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col-12 mt-3\\t\\">\\r\\n\\t\\t\\t\\t<form class=\\"form-floating mb-3\\">\\r\\n\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\tid=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\tplaceholder=\\"name@example.com\\"\\r\\n\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t<label for=\\"email\\">Your Email Address</label>\\r\\n\\t\\t\\t\\t</form>\\r\\n\\t\\t\\t\\t<div class=\\"form-floating \\">\\r\\n\\t\\t\\t\\t\\t<textarea\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\tplaceholder=\\"Leave a comment here\\"\\r\\n\\t\\t\\t\\t\\t\\tid=\\"comment\\"\\r\\n\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t<label for=\\"comment\\">Your can write your thoughts here</label>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<button class=\\"btn btn-primary mt-5\\"\\r\\n\\t\\t\\t\\t\\t><i class=\\"bi bi-cloud-arrow-up me-2\\" style=\\"font-size: 1.5em;\\" />Send your thoughts</button\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"scroller\\" in:fade={{ duration: 500, delay: 500 }}>\\r\\n\\t\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t\\t>KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;</MarqueeTextWidget\\r\\n\\t\\t>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\r\\n\\t.scroller {\\r\\n\\t\\twidth: 100vw;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0%;\\r\\n\\t\\tleft: 0%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.1;\\r\\n\\t\\tfont-size: 5rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: -10;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAoDC,IAAI,aAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AAED,SAAS,aAAC,CAAC,AACV,KAAK,CAAE,KAAK,CACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,EAAE,CACP,IAAI,CAAE,EAAE,CACR,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,AACb,CAAC"}`
};
var prerender$1 = true;
var Contact = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$f);
  return `<svele:head><title>Connect With Us | Abie G</title></svele:head>

<main class="${"svelte-vwfhd"}"><div class="${"container text-white"}"><p class="${"display-3"}">Connect with us</p>
		<div class="${"row mt-5"}"><div class="${"col-12"}"><h3>Write your thoughts</h3></div>
			<div class="${"col-12 mt-3 "}"><form class="${"form-floating mb-3"}"><input type="${"email"}" class="${"form-control bg-transparent"}" id="${"email"}" placeholder="${"name@example.com"}">
					<label for="${"email"}">Your Email Address</label></form>
				<div class="${"form-floating "}"><textarea class="${"form-control bg-transparent"}" placeholder="${"Leave a comment here"}" id="${"comment"}"></textarea>
					<label for="${"comment"}">Your can write your thoughts here</label></div>
				<button class="${"btn btn-primary mt-5"}"><i class="${"bi bi-cloud-arrow-up me-2"}" style="${"font-size: 1.5em;"}"></i>Send your thoughts</button></div></div></div>
	<div class="${"scroller svelte-vwfhd"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `KEEP IN TOUCH \xA0KEEP IN TOUCH \xA0KEEP IN TOUCH \xA0`
  })}</div>
</main>`;
});
var contact = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Contact,
  prerender: prerender$1
});
var css$e = {
  code: 'main.svelte-1j21mct{position:relative;min-height:100vh;margin-top:120px;z-index:3}img.svelte-1j21mct{object-fit:cover;border-radius:20px}.scroller.svelte-1j21mct{width:100vw;position:absolute;top:0%;left:0%;color:white;opacity:0.1;font-size:5rem;font-family:"Thunder Bold";user-select:none;z-index:-10}',
  map: `{"version":3,"file":"about.svelte","sources":["about.svelte"],"sourcesContent":["<script context='module'>\\r\\n\\texport const prerender = true;\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\tlet _componentReady = false;\\r\\n\\r\\n\\tonMount((e) => {\\r\\n\\t\\t_componentReady = true;\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>About Us | Abie G</title>\\r\\n</svele:head>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500 }} out:fly={{ y: 40, duration: 500 }}>\\r\\n\\t<div class=\\"container text-white mb-5\\">\\r\\n\\t\\t<div class=\\"row row-cols-1 row-cols-lg-2\\">\\r\\n\\t\\t\\t<div class=\\"col d-flex flex-column justify-content-center\\">\\r\\n\\t\\t\\t\\t<h2 class=\\"display-3\\">Hi!</h2>\\r\\n\\t\\t\\t\\t<p class=\\"lead\\">\\r\\n\\t\\t\\t\\t\\tThe website is a project by BSCS3A students from University of Caloocan City - Congress\\r\\n\\t\\t\\t\\t\\tCampus to fulfill the requirement on Advanced Web Systems and is created solely for\\r\\n\\t\\t\\t\\t\\tacademic purposes only.\\r\\n\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col\\">\\r\\n\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\r\\n\\t\\t\\t\\t\\tstyle=\\"max-width: 800px; width: 120%;\\"\\r\\n\\t\\t\\t\\t\\tsrc=\\"illustrations/undraw_Co-working_re_w93t.svg\\"\\r\\n\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t/>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container text-white mb-5\\">\\r\\n\\t\\t<div class=\\"row row-lg-reverse row-cols-1 row-cols-lg-2\\">\\r\\n\\t\\t\\t<div class=\\"col d-none d-sm-block\\">\\r\\n\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\r\\n\\t\\t\\t\\t\\tstyle=\\"max-width: 800px; width: 150%; transform: translateX(-50%)\\"\\r\\n\\t\\t\\t\\t\\tsrc=\\"illustrations/undraw_programming_2svr.svg\\"\\r\\n\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t/>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col d-flex flex-column justify-content-center text-end\\">\\r\\n\\t\\t\\t\\t<h2 class=\\"display-3\\">What made this site?</h2>\\r\\n\\t\\t\\t\\t<div class=\\"row row-cols-3 justify-content-between mt-5\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"d-flex flex-column align-items-center text-center\\">\\r\\n\\t\\t\\t\\t\\t\\t<img width=\\"100\\" style=\\"border-radius: 10px;\\" src=\\"./logo/svelte.png\\" alt=\\"\\" />\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">Svelte Kit</p>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">for interaction</p>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"d-flex flex-column align-items-center text-center\\">\\r\\n\\t\\t\\t\\t\\t\\t<img width=\\"100\\" style=\\"border-radius: 10px;\\" src=\\"./logo/vercel.png\\" alt=\\"\\" />\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">Vercel</p>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">for deployment</p>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"d-flex flex-column align-items-center text-center\\">\\r\\n\\t\\t\\t\\t\\t\\t<img width=\\"100\\" style=\\"border-radius: 10px;\\" src=\\"./logo/supabase.jpg\\" alt=\\"\\" />\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">Supabase</p>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"lead\\">for content</p>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col d-block d-lg-none\\">\\r\\n\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\tclass=\\"mb-5\\"\\r\\n\\t\\t\\t\\t\\tstyle=\\"max-width: 800px; width: 150%; transform: translateX(-50%)\\"\\r\\n\\t\\t\\t\\t\\tsrc=\\"illustrations/undraw_programming_2svr.svg\\"\\r\\n\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t/>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container text-white mb-5\\">\\r\\n\\t\\t<h2 class=\\"display-3 mb-5\\">Meet the creators</h2>\\r\\n\\t\\t<div\\r\\n\\t\\t\\tid=\\"aboutUsCarouselControls\\"\\r\\n\\t\\t\\tclass=\\"carousel slide\\"\\r\\n\\t\\t\\tdata-bs-ride=\\"carousel\\"\\r\\n\\t\\t\\tdata-bs-interval=\\"3000\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<div class=\\"carousel-inner\\">\\r\\n\\t\\t\\t\\t<div class=\\"carousel-item active\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"max-width: 350px; width: 100%;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Gerald Chavez</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Lead Developer, Lead Designer, & Project Manager</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"carousel-item\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"max-width: 350px; width: 100%;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Gabrielle Napoto</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Designer, Content Manager, & Abie G</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"max-width: 350px; width: 100%; height: 100%;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Trizhalyn Maglangit</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Designer & Content Manager</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"carousel-item\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"max-width: 350px; width: 100%;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Mikkie Gregorio</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Designer & Content Manager</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\theight=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Kevin Corpin</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Quality Assurance</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"carousel-item\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\theight=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Carlo Diaz</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Quality Assurance</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-6 d-flex flex-column justify-content-center align-items-center\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\twidth=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\theight=\\"350\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"mt-5 display-6\\">Edriane Barcita</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Server Maintenance and Management</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<button\\r\\n\\t\\t\\t\\tclass=\\"carousel-control-prev\\"\\r\\n\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\tdata-bs-target=\\"#aboutUsCarouselControls\\"\\r\\n\\t\\t\\t\\tdata-bs-slide=\\"prev\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t<span class=\\"carousel-control-prev-icon\\" aria-hidden=\\"true\\" />\\r\\n\\t\\t\\t\\t<span class=\\"visually-hidden\\">Previous</span>\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t\\t<button\\r\\n\\t\\t\\t\\tclass=\\"carousel-control-next\\"\\r\\n\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\tdata-bs-target=\\"#aboutUsCarouselControls\\"\\r\\n\\t\\t\\t\\tdata-bs-slide=\\"next\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t<span class=\\"carousel-control-next-icon\\" aria-hidden=\\"true\\" />\\r\\n\\t\\t\\t\\t<span class=\\"visually-hidden\\">Next</span>\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"scroller\\">\\r\\n\\t\\t<MarqueeTextWidget duration={10}\\r\\n\\t\\t\\t>WHO MADE THIS SITE? &nbsp; WHO MADE THIS SITE? &nbsp; WHO MADE THIS SITE? &nbsp;</MarqueeTextWidget\\r\\n\\t\\t>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  min-height: 100vh;\\n  margin-top: 120px;\\n  z-index: 3;\\n}\\n\\nimg {\\n  object-fit: cover;\\n  border-radius: 20px;\\n}\\n\\n.scroller {\\n  width: 100vw;\\n  position: absolute;\\n  top: 0%;\\n  left: 0%;\\n  color: white;\\n  opacity: 0.1;\\n  font-size: 5rem;\\n  font-family: \\"Thunder Bold\\";\\n  user-select: none;\\n  z-index: -10;\\n}</style>\\r\\n"],"names":[],"mappings":"AAwMmB,IAAI,eAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,GAAG,eAAC,CAAC,AACH,UAAU,CAAE,KAAK,CACjB,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,SAAS,eAAC,CAAC,AACT,KAAK,CAAE,KAAK,CACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,EAAE,CACP,IAAI,CAAE,EAAE,CACR,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,AACd,CAAC"}`
};
var prerender = true;
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$e);
  return `<svele:head><title>About Us | Abie G</title></svele:head>

<main class="${"svelte-1j21mct"}"><div class="${"container text-white mb-5"}"><div class="${"row row-cols-1 row-cols-lg-2"}"><div class="${"col d-flex flex-column justify-content-center"}"><h2 class="${"display-3"}">Hi!</h2>
				<p class="${"lead"}">The website is a project by BSCS3A students from University of Caloocan City - Congress
					Campus to fulfill the requirement on Advanced Web Systems and is created solely for
					academic purposes only.
				</p></div>
			<div class="${"col"}"><img class="${"mb-5 svelte-1j21mct"}" style="${"max-width: 800px; width: 120%;"}" src="${"illustrations/undraw_Co-working_re_w93t.svg"}" alt="${""}"></div></div></div>
	<div class="${"container text-white mb-5"}"><div class="${"row row-lg-reverse row-cols-1 row-cols-lg-2"}"><div class="${"col d-none d-sm-block"}"><img class="${"mb-5 svelte-1j21mct"}" style="${"max-width: 800px; width: 150%; transform: translateX(-50%)"}" src="${"illustrations/undraw_programming_2svr.svg"}" alt="${""}"></div>
			<div class="${"col d-flex flex-column justify-content-center text-end"}"><h2 class="${"display-3"}">What made this site?</h2>
				<div class="${"row row-cols-3 justify-content-between mt-5"}"><div class="${"d-flex flex-column align-items-center text-center"}"><img width="${"100"}" style="${"border-radius: 10px;"}" src="${"./logo/svelte.png"}" alt="${""}" class="${"svelte-1j21mct"}">
						<p class="${"lead"}">Svelte Kit</p>
						<p class="${"lead"}">for interaction</p></div>
					<div class="${"d-flex flex-column align-items-center text-center"}"><img width="${"100"}" style="${"border-radius: 10px;"}" src="${"./logo/vercel.png"}" alt="${""}" class="${"svelte-1j21mct"}">
						<p class="${"lead"}">Vercel</p>
						<p class="${"lead"}">for deployment</p></div>
					<div class="${"d-flex flex-column align-items-center text-center"}"><img width="${"100"}" style="${"border-radius: 10px;"}" src="${"./logo/supabase.jpg"}" alt="${""}" class="${"svelte-1j21mct"}">
						<p class="${"lead"}">Supabase</p>
						<p class="${"lead"}">for content</p></div></div></div>
			<div class="${"col d-block d-lg-none"}"><img class="${"mb-5 svelte-1j21mct"}" style="${"max-width: 800px; width: 150%; transform: translateX(-50%)"}" src="${"illustrations/undraw_programming_2svr.svg"}" alt="${""}"></div></div></div>
	<div class="${"container text-white mb-5"}"><h2 class="${"display-3 mb-5"}">Meet the creators</h2>
		<div id="${"aboutUsCarouselControls"}" class="${"carousel slide"}" data-bs-ride="${"carousel"}" data-bs-interval="${"3000"}"><div class="${"carousel-inner"}"><div class="${"carousel-item active"}"><div class="${"row"}"><div class="${"col-sm-12 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg"}" alt="${""}" style="${"max-width: 350px; width: 100%;"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Gerald Chavez</h3>
							<p>Lead Developer, Lead Designer, &amp; Project Manager</p></div></div></div>
				<div class="${"carousel-item"}"><div class="${"row"}"><div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png"}" alt="${""}" style="${"max-width: 350px; width: 100%;"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Gabrielle Napoto</h3>
							<p>Designer, Content Manager, &amp; Abie G</p></div>
						<div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg"}" alt="${""}" style="${"max-width: 350px; width: 100%; height: 100%;"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Trizhalyn Maglangit</h3>
							<p>Designer &amp; Content Manager</p></div></div></div>
				<div class="${"carousel-item"}"><div class="${"row"}"><div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg"}" alt="${""}" style="${"max-width: 350px; width: 100%;"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Mikkie Gregorio</h3>
							<p>Designer &amp; Content Manager</p></div>
						<div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg"}" alt="${""}" width="${"350"}" height="${"350"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Kevin Corpin</h3>
							<p>Quality Assurance</p></div></div></div>
				<div class="${"carousel-item"}"><div class="${"row"}"><div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg"}" alt="${""}" width="${"350"}" height="${"350"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Carlo Diaz</h3>
							<p>Quality Assurance</p></div>
						<div class="${"col-sm-6 d-flex flex-column justify-content-center align-items-center"}"><img src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg"}" alt="${""}" width="${"350"}" height="${"350"}" class="${"svelte-1j21mct"}">
							<h3 class="${"mt-5 display-6"}">Edriane Barcita</h3>
							<p>Server Maintenance and Management</p></div></div></div></div>
			<button class="${"carousel-control-prev"}" type="${"button"}" data-bs-target="${"#aboutUsCarouselControls"}" data-bs-slide="${"prev"}"><span class="${"carousel-control-prev-icon"}" aria-hidden="${"true"}"></span>
				<span class="${"visually-hidden"}">Previous</span></button>
			<button class="${"carousel-control-next"}" type="${"button"}" data-bs-target="${"#aboutUsCarouselControls"}" data-bs-slide="${"next"}"><span class="${"carousel-control-next-icon"}" aria-hidden="${"true"}"></span>
				<span class="${"visually-hidden"}">Next</span></button></div></div>
	<div class="${"scroller svelte-1j21mct"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 10 }, {}, {
    default: () => `WHO MADE THIS SITE? \xA0 WHO MADE THIS SITE? \xA0 WHO MADE THIS SITE? \xA0`
  })}</div>
</main>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About,
  prerender
});
var defaults = {
  duration: 4e3,
  initial: 1,
  next: 0,
  pausable: false,
  dismissable: true,
  reversed: false,
  intro: { x: 256 },
  theme: {}
};
var createToast = () => {
  const { subscribe: subscribe2, update } = writable([]);
  let count = 0;
  const options2 = {};
  const _obj = (obj) => obj instanceof Object;
  const push = (msg, opts = {}) => {
    const param = { target: "default", ..._obj(msg) ? msg : { ...opts, msg } };
    const conf = options2[param.target] || {};
    const entry = {
      ...defaults,
      ...conf,
      ...param,
      theme: { ...conf.theme, ...param.theme },
      id: ++count
    };
    update((n) => entry.reversed ? [...n, entry] : [entry, ...n]);
    return count;
  };
  const pop = (id) => {
    update((n) => {
      if (!n.length || id === 0)
        return [];
      if (_obj(id))
        return n.filter((i) => id(i));
      const target = id || Math.max(...n.map((i) => i.id));
      return n.filter((i) => i.id !== target);
    });
  };
  const set = (id, opts = {}) => {
    const param = _obj(id) ? { ...id } : { ...opts, id };
    update((n) => {
      const idx = n.findIndex((i) => i.id === param.id);
      if (idx > -1) {
        n[idx] = { ...n[idx], ...param };
      }
      return n;
    });
  };
  const _init = (target = "default", opts = {}) => {
    options2[target] = opts;
    return options2;
  };
  return { subscribe: subscribe2, push, pop, set, _init };
};
var toast = createToast();
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults2 = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults2), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
var css$d = {
  code: "._toastItem.svelte-j9nwjb{width:var(--toastWidth, 16rem);height:var(--toastHeight, auto);min-height:var(--toastMinHeight, 3.5rem);margin:var(--toastMargin, 0 0 0.5rem 0);padding:var(--toastPadding, 0);background:var(--toastBackground, rgba(66, 66, 66, 0.9));color:var(--toastColor, #fff);box-shadow:var(--toastBoxShadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));border:var(--toastBorder, none);border-radius:var(--toastBorderRadius, 0.125rem);position:relative;display:flex;flex-direction:row;align-items:center;overflow:hidden;will-change:transform, opacity;-webkit-tap-highlight-color:transparent}._toastMsg.svelte-j9nwjb{padding:var(--toastMsgPadding, 0.75rem 0.5rem);flex:1 1 0%}.pe.svelte-j9nwjb,._toastMsg.svelte-j9nwjb a{pointer-events:auto}._toastBtn.svelte-j9nwjb{width:2rem;height:100%;font:1rem sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none}._toastBar.svelte-j9nwjb{top:var(--toastBarTop, auto);right:var(--toastBarRight, auto);bottom:var(--toastBarBottom, 0);left:var(--toastBarLeft, 0);height:var(--toastBarHeight, 6px);width:var(--toastBarWidth, 100%);position:absolute;display:block;-webkit-appearance:none;-moz-appearance:none;appearance:none;border:none;background:transparent;pointer-events:none}._toastBar.svelte-j9nwjb::-webkit-progress-bar{background:transparent}._toastBar.svelte-j9nwjb::-webkit-progress-value{background:var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)))}._toastBar.svelte-j9nwjb::-moz-progress-bar{background:var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)))}",
  map: `{"version":3,"file":"ToastItem.svelte","sources":["ToastItem.svelte"],"sourcesContent":["<script>\\nimport { onDestroy } from 'svelte'\\nimport { tweened } from 'svelte/motion'\\nimport { linear } from 'svelte/easing'\\nimport { toast } from './stores.js'\\n\\nexport let item\\n\\nconst progress = tweened(item.initial, { duration: item.duration, easing: linear })\\nconst close = () => toast.pop(item.id)\\nconst autoclose = () => {\\n  if ($progress === 1 || $progress === 0) {\\n    close()\\n  }\\n}\\nlet next = item.initial\\nlet prev = next\\nlet paused = false\\n\\n$: if (next !== item.next) {\\n  next = item.next\\n  prev = $progress\\n  paused = false\\n  progress.set(next).then(autoclose)\\n}\\n\\nconst pause = () => {\\n  if (item.pausable && !paused && $progress !== next) {\\n    progress.set($progress, { duration: 0 })\\n    paused = true\\n  }\\n}\\n\\nconst resume = () => {\\n  if (paused) {\\n    const d = item.duration\\n    const duration = d - d * (($progress - prev) / (next - prev))\\n    progress.set(next, { duration }).then(autoclose)\\n    paused = false\\n  }\\n}\\n\\nconst getProps = () => {\\n  const { props = {}, sendIdTo } = item.component\\n  if (sendIdTo) {\\n    props[sendIdTo] = item.id\\n  }\\n  return props\\n}\\n\\n// \`progress\` has been renamed to \`next\`; shim included for backward compatibility, to remove in next major\\n$: if (typeof item.progress !== 'undefined') {\\n  item.next = item.progress\\n}\\n\\nonDestroy(() => {\\n  if (typeof item.onpop === 'function') {\\n    item.onpop(item.id)\\n  }\\n})\\n<\/script>\\n\\n<style>\\n._toastItem {\\n  width: var(--toastWidth, 16rem);\\n  height: var(--toastHeight, auto);\\n  min-height: var(--toastMinHeight, 3.5rem);\\n  margin: var(--toastMargin, 0 0 0.5rem 0);\\n  padding: var(--toastPadding, 0);\\n  background: var(--toastBackground, rgba(66, 66, 66, 0.9));\\n  color: var(--toastColor, #fff);\\n  box-shadow: var(--toastBoxShadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));\\n  border: var(--toastBorder, none);\\n  border-radius: var(--toastBorderRadius, 0.125rem);\\n  position: relative;\\n  display: flex;\\n  flex-direction: row;\\n  align-items: center;\\n  overflow: hidden;\\n  will-change: transform, opacity;\\n  -webkit-tap-highlight-color: transparent;\\n}\\n._toastMsg {\\n  padding: var(--toastMsgPadding, 0.75rem 0.5rem);\\n  flex: 1 1 0%;\\n}\\n.pe,\\n._toastMsg :global(a) {\\n  pointer-events: auto;\\n}\\n._toastBtn {\\n  width: 2rem;\\n  height: 100%;\\n  font: 1rem sans-serif;\\n  display: flex;\\n  align-items: center;\\n  justify-content: center;\\n  cursor: pointer;\\n  outline: none;\\n}\\n._toastBar {\\n  top: var(--toastBarTop, auto);\\n  right: var(--toastBarRight, auto);\\n  bottom: var(--toastBarBottom, 0);\\n  left: var(--toastBarLeft, 0);\\n  height: var(--toastBarHeight, 6px);\\n  width: var(--toastBarWidth, 100%);\\n  position: absolute;\\n  display: block;\\n  -webkit-appearance: none;\\n  -moz-appearance: none;\\n  appearance: none;\\n  border: none;\\n  background: transparent;\\n  pointer-events: none;\\n}\\n._toastBar::-webkit-progress-bar {\\n  background: transparent;\\n}\\n/* \`--toastProgressBackground\` renamed to \`--toastBarBackground\`; override included for backward compatibility */\\n._toastBar::-webkit-progress-value {\\n  background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));\\n}\\n._toastBar::-moz-progress-bar {\\n  background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));\\n}\\n</style>\\n\\n<div class=\\"_toastItem\\" class:pe={item.pausable} on:mouseenter={pause} on:mouseleave={resume}>\\n  <div class=\\"_toastMsg\\" class:pe={item.component}>\\n    {#if item.component}\\n      <svelte:component this={item.component.src} {...getProps()} />\\n    {:else}\\n      {@html item.msg}\\n    {/if}\\n  </div>\\n  {#if item.dismissable}\\n    <div class=\\"_toastBtn pe\\" role=\\"button\\" tabindex=\\"-1\\" on:click={close}>\u2715</div>\\n  {/if}\\n  <progress class=\\"_toastBar\\" value={$progress} />\\n</div>\\n"],"names":[],"mappings":"AA+DA,WAAW,cAAC,CAAC,AACX,KAAK,CAAE,IAAI,YAAY,CAAC,MAAM,CAAC,CAC/B,MAAM,CAAE,IAAI,aAAa,CAAC,KAAK,CAAC,CAChC,UAAU,CAAE,IAAI,gBAAgB,CAAC,OAAO,CAAC,CACzC,MAAM,CAAE,IAAI,aAAa,CAAC,aAAa,CAAC,CACxC,OAAO,CAAE,IAAI,cAAc,CAAC,EAAE,CAAC,CAC/B,UAAU,CAAE,IAAI,iBAAiB,CAAC,sBAAsB,CAAC,CACzD,KAAK,CAAE,IAAI,YAAY,CAAC,KAAK,CAAC,CAC9B,UAAU,CAAE,IAAI,gBAAgB,CAAC,sEAAsE,CAAC,CACxG,MAAM,CAAE,IAAI,aAAa,CAAC,KAAK,CAAC,CAChC,aAAa,CAAE,IAAI,mBAAmB,CAAC,SAAS,CAAC,CACjD,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,SAAS,CAAC,CAAC,OAAO,CAC/B,2BAA2B,CAAE,WAAW,AAC1C,CAAC,AACD,UAAU,cAAC,CAAC,AACV,OAAO,CAAE,IAAI,iBAAiB,CAAC,eAAe,CAAC,CAC/C,IAAI,CAAE,CAAC,CAAC,CAAC,CAAC,EAAE,AACd,CAAC,AACD,iBAAG,CACH,wBAAU,CAAC,AAAQ,CAAC,AAAE,CAAC,AACrB,cAAc,CAAE,IAAI,AACtB,CAAC,AACD,UAAU,cAAC,CAAC,AACV,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,IAAI,CAAC,UAAU,CACrB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,OAAO,CACf,OAAO,CAAE,IAAI,AACf,CAAC,AACD,UAAU,cAAC,CAAC,AACV,GAAG,CAAE,IAAI,aAAa,CAAC,KAAK,CAAC,CAC7B,KAAK,CAAE,IAAI,eAAe,CAAC,KAAK,CAAC,CACjC,MAAM,CAAE,IAAI,gBAAgB,CAAC,EAAE,CAAC,CAChC,IAAI,CAAE,IAAI,cAAc,CAAC,EAAE,CAAC,CAC5B,MAAM,CAAE,IAAI,gBAAgB,CAAC,IAAI,CAAC,CAClC,KAAK,CAAE,IAAI,eAAe,CAAC,KAAK,CAAC,CACjC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,kBAAkB,CAAE,IAAI,CACxB,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,WAAW,CACvB,cAAc,CAAE,IAAI,AACtB,CAAC,AACD,wBAAU,sBAAsB,AAAC,CAAC,AAChC,UAAU,CAAE,WAAW,AACzB,CAAC,AAED,wBAAU,wBAAwB,AAAC,CAAC,AAClC,UAAU,CAAE,IAAI,yBAAyB,CAAC,oDAAoD,CAAC,AACjG,CAAC,AACD,wBAAU,mBAAmB,AAAC,CAAC,AAC7B,UAAU,CAAE,IAAI,yBAAyB,CAAC,oDAAoD,CAAC,AACjG,CAAC"}`
};
var ToastItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $progress, $$unsubscribe_progress;
  let { item } = $$props;
  const progress = tweened(item.initial, { duration: item.duration, easing: identity });
  $$unsubscribe_progress = subscribe(progress, (value) => $progress = value);
  const close = () => toast.pop(item.id);
  const autoclose = () => {
    if ($progress === 1 || $progress === 0) {
      close();
    }
  };
  let next = item.initial;
  const getProps = () => {
    const { props = {}, sendIdTo } = item.component;
    if (sendIdTo) {
      props[sendIdTo] = item.id;
    }
    return props;
  };
  onDestroy(() => {
    if (typeof item.onpop === "function") {
      item.onpop(item.id);
    }
  });
  if ($$props.item === void 0 && $$bindings.item && item !== void 0)
    $$bindings.item(item);
  $$result.css.add(css$d);
  {
    if (typeof item.progress !== "undefined") {
      item.next = item.progress;
    }
  }
  {
    if (next !== item.next) {
      next = item.next;
      progress.set(next).then(autoclose);
    }
  }
  $$unsubscribe_progress();
  return `<div class="${["_toastItem svelte-j9nwjb", item.pausable ? "pe" : ""].join(" ").trim()}"><div class="${["_toastMsg svelte-j9nwjb", item.component ? "pe" : ""].join(" ").trim()}">${item.component ? `${validate_component(item.component.src || missing_component, "svelte:component").$$render($$result, Object.assign(getProps()), {}, {})}` : `<!-- HTML_TAG_START -->${item.msg}<!-- HTML_TAG_END -->`}</div>
  ${item.dismissable ? `<div class="${"_toastBtn pe svelte-j9nwjb"}" role="${"button"}" tabindex="${"-1"}">\u2715</div>` : ``}
  <progress class="${"_toastBar svelte-j9nwjb"}"${add_attribute("value", $progress, 0)}></progress></div>`;
});
var css$c = {
  code: "._toastContainer.svelte-7xr3c1{top:var(--toastContainerTop, 1.5rem);right:var(--toastContainerRight, 2rem);bottom:var(--toastContainerBottom, auto);left:var(--toastContainerLeft, auto);position:fixed;margin:0;padding:0;list-style-type:none;pointer-events:none;z-index:9999}",
  map: `{"version":3,"file":"SvelteToast.svelte","sources":["SvelteToast.svelte"],"sourcesContent":["<script>\\nimport { fade, fly } from 'svelte/transition'\\nimport { flip } from 'svelte/animate'\\nimport { toast } from './stores.js'\\nimport ToastItem from './ToastItem.svelte'\\n\\nexport let options = {}\\nexport let target = 'default'\\n\\n$: toast._init(target, options)\\n\\nlet items\\n$: items = $toast.filter((i) => i.target === target)\\n\\nconst getCss = (theme) => Object.keys(theme).reduce((a, c) => \`\${a}\${c}:\${theme[c]};\`, '')\\n<\/script>\\n\\n<style>\\n._toastContainer {\\n  top: var(--toastContainerTop, 1.5rem);\\n  right: var(--toastContainerRight, 2rem);\\n  bottom: var(--toastContainerBottom, auto);\\n  left: var(--toastContainerLeft, auto);\\n  position: fixed;\\n  margin: 0;\\n  padding: 0;\\n  list-style-type: none;\\n  pointer-events: none;\\n  z-index: 9999;\\n}\\n</style>\\n\\n<ul class=\\"_toastContainer\\">\\n  {#each items as item (item.id)}\\n    <li in:fly={item.intro} out:fade animate:flip={{ duration: 200 }} style={getCss(item.theme)}>\\n      <ToastItem {item} />\\n    </li>\\n  {/each}\\n</ul>\\n"],"names":[],"mappings":"AAkBA,gBAAgB,cAAC,CAAC,AAChB,GAAG,CAAE,IAAI,mBAAmB,CAAC,OAAO,CAAC,CACrC,KAAK,CAAE,IAAI,qBAAqB,CAAC,KAAK,CAAC,CACvC,MAAM,CAAE,IAAI,sBAAsB,CAAC,KAAK,CAAC,CACzC,IAAI,CAAE,IAAI,oBAAoB,CAAC,KAAK,CAAC,CACrC,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,CACV,eAAe,CAAE,IAAI,CACrB,cAAc,CAAE,IAAI,CACpB,OAAO,CAAE,IAAI,AACf,CAAC"}`
};
var SvelteToast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $toast, $$unsubscribe_toast;
  $$unsubscribe_toast = subscribe(toast, (value) => $toast = value);
  let { options: options2 = {} } = $$props;
  let { target = "default" } = $$props;
  let items;
  const getCss = (theme) => Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, "");
  if ($$props.options === void 0 && $$bindings.options && options2 !== void 0)
    $$bindings.options(options2);
  if ($$props.target === void 0 && $$bindings.target && target !== void 0)
    $$bindings.target(target);
  $$result.css.add(css$c);
  {
    toast._init(target, options2);
  }
  items = $toast.filter((i) => i.target === target);
  $$unsubscribe_toast();
  return `<ul class="${"_toastContainer svelte-7xr3c1"}">${each(items, (item) => `<li${add_attribute("style", getCss(item.theme), 0)}>${validate_component(ToastItem, "ToastItem").$$render($$result, { item }, {}, {})}
    </li>`)}</ul>`;
});
var css$b = {
  code: "main.svelte-e67pm3{position:relative;min-height:100vh;z-index:3}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\timport { supabase, global_mod_account, global_account_data } from '../../global';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { toast, SvelteToast } from '@zerodevx/svelte-toast';\\r\\n\\r\\n\\tlet hasAccess = null;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet user = await supabase.auth.user();\\r\\n\\t\\tif (user) {\\r\\n\\t\\t\\tlet { data, error } = await supabase.from('users').select('*').eq('id', user.id);\\r\\n\\t\\t\\tif (data[0].isModerator == true) {\\r\\n\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\thasAccess = true;\\r\\n\\t\\t\\t\\t\\tgoto('/admin/dashboard');\\r\\n\\t\\t\\t\\t}, 1000);\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\thasAccess = false;\\r\\n\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\tgoto('/admin/dashboard');\\r\\n\\t\\t\\t\\t}, 1000);\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\thasAccess = false;\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\tgoto('/');\\r\\n\\t\\t\\t}, 1500);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>Moderator Sign In | Abie G</title>\\r\\n</svele:head>\\r\\n<SvelteToast option={{ duration: 1000 }} />\\r\\n\\r\\n<main\\r\\n\\tclass=\\"text-white d-flex flex-column align-items-center justify-content-center\\"\\r\\n\\tin:fly={{ y: -40, duration: 500, delay: 500 }}\\r\\n\\tout:fly={{ y: 40, duration: 500 }}\\r\\n>\\r\\n\\t{#if hasAccess == false}\\r\\n\\t\\t<div class=\\"mt-5 text-center\\">\\r\\n\\t\\t\\t<i class=\\"bi bi-exclamation-diamond\\" style=\\"font-size: 10rem;\\" />\\r\\n\\t\\t\\t<p class=\\"mt-5 lead\\">Sorry, you do not have any privilege to sign in a Moderator Account</p>\\r\\n\\t\\t</div>\\r\\n\\t{:else if hasAccess == null}\\r\\n\\t\\t<div class=\\"spinner-border\\" role=\\"status\\">\\r\\n\\t\\t\\t<span class=\\"visually-hidden\\">Loading...</span>\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA0DC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Admin = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$b);
  return `<svele:head><title>Moderator Sign In | Abie G</title></svele:head>
${validate_component(SvelteToast, "SvelteToast").$$render($$result, { option: { duration: 1e3 } }, {}, {})}

<main class="${"text-white d-flex flex-column align-items-center justify-content-center svelte-e67pm3"}">${`${`<div class="${"spinner-border"}" role="${"status"}"><span class="${"visually-hidden"}">Loading...</span></div>`}`}
</main>`;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Admin
});
var css$a = {
  code: "main.svelte-xq1t9b{position:relative;min-height:100vh;margin-top:120px;z-index:3}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\timport AdminPostCard from '../../../components/AdminPostCard.svelte';\\r\\n\\timport toastify from 'toastify-js';\\r\\n\\timport 'toastify-js/src/toastify.css';\\r\\n\\r\\n\\t// component variables\\r\\n\\tlet hasBlog = null;\\r\\n\\tlet blogs;\\r\\n\\tlet tabActive = 2;\\r\\n\\tlet hasAccount;\\r\\n\\tlet user = supabase.auth.user();\\r\\n\\r\\n\\tlet blog_title;\\r\\n\\tlet blog_imageURI;\\r\\n\\tlet blog_content;\\r\\n\\tlet blog_visibility = false;\\r\\n\\r\\n\\t// methods\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tif (supabase.auth.user()) {\\r\\n\\t\\t\\tif (supabase.auth.user().role == 'authenticated') {\\r\\n\\t\\t\\t\\tlet user = supabase.auth.user();\\r\\n\\t\\t\\t\\tlet { data, error } = await supabase.from('users').select('*').eq('id', user.id);\\r\\n\\t\\t\\t\\tif (data[0].isModerator == true || data[0].isAdmin == true) {\\r\\n\\t\\t\\t\\t\\thasAccount = true;\\r\\n\\t\\t\\t\\t} else {\\r\\n\\t\\t\\t\\t\\tgoto('/admin');\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}\\r\\n\\r\\n\\t\\t\\tif (hasAccount) {\\r\\n\\t\\t\\t\\tgetPosts();\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tgoto('/admin');\\r\\n\\t\\t}\\r\\n\\t});\\r\\n\\r\\n\\tconst getPosts = async (e) => {\\r\\n\\t\\tconst { data, error } = await supabase\\r\\n\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t.select('*')\\r\\n\\t\\t\\t.eq('author', user.email.split('@')[0]);\\r\\n\\r\\n\\t\\thasBlog = null;\\r\\n\\t\\tif (error || data.length < 1) {\\r\\n\\t\\t\\thasBlog = false;\\r\\n\\t\\t}\\r\\n\\t\\tif (!error || data.length > 0) {\\r\\n\\t\\t\\tblogs = data;\\r\\n\\t\\t\\thasBlog = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tlet postBlog = async (e) => {\\r\\n\\t\\tif (blog_title && blog_content) {\\r\\n\\t\\t\\tconst { data, error } = await supabase.from('posts').insert([\\r\\n\\t\\t\\t\\t{\\r\\n\\t\\t\\t\\t\\ttitle: blog_title,\\r\\n\\t\\t\\t\\t\\tauthor: user.email.split('@')[0],\\r\\n\\t\\t\\t\\t\\tcontent: blog_content,\\r\\n\\t\\t\\t\\t\\theader_img: blog_imageURI ? blog_imageURI : 'https://picsum.photos/500/500',\\r\\n\\t\\t\\t\\t\\tisExclusive: blog_visibility\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t]);\\r\\n\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\t\\ttext: \`\${blog_title} is now posted \${!blog_visibility ? 'publicly' : 'exclusively'}\`,\\r\\n\\t\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\t\\tbackground: '#06d6a0',\\r\\n\\t\\t\\t\\t\\t\\tcolor: '#212529'\\r\\n\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t}).showToast();\\r\\n\\t\\t\\t\\tblog_title = '';\\r\\n\\t\\t\\t\\tblog_content = '';\\r\\n\\t\\t\\t\\tblog_visibility = false;\\r\\n\\t\\t\\t\\ttabActive = 2;\\r\\n\\t\\t\\t\\tgetPosts();\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\t// toast.message('Please fill out all forms');\\r\\n\\t\\t\\ttoastify({\\r\\n\\t\\t\\t\\ttext: 'Please fill the Title and the Description',\\r\\n\\t\\t\\t\\tduration: 2000,\\r\\n\\t\\t\\t\\tclose: true,\\r\\n\\t\\t\\t\\tgravity: 'bottom',\\r\\n\\t\\t\\t\\tposition: 'right',\\r\\n\\t\\t\\t\\tstyle: {\\r\\n\\t\\t\\t\\t\\tbackground: '#ef476f'\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}).showToast();\\r\\n\\t\\t}\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>Dashboard | Abie G</title>\\r\\n</svele:head>\\r\\n<main\\r\\n\\tstyle=\\"margin-bottom: 10em;\\"\\r\\n\\tin:fly={{ y: -40, duration: 500, delay: 500 }}\\r\\n\\tout:fly={{ y: 40, duration: 500 }}\\r\\n>\\r\\n\\t<div class=\\"container text-white\\">\\r\\n\\t\\t<p class=\\"display-3\\">Moderator Dashboard</p>\\r\\n\\r\\n\\t\\t<div class=\\"btn-group mt-3 w-100\\">\\r\\n\\t\\t\\t<button\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\ttabActive = 1;\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\tclass=\\"btn btn-lg btn-outline-primary\\">Add a Story</button\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t<button\\r\\n\\t\\t\\t\\ton:click={(e) => {\\r\\n\\t\\t\\t\\t\\ttabActive = 2;\\r\\n\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\tclass=\\"btn btn-lg btn-outline-primary\\">Your Stories</button\\r\\n\\t\\t\\t>\\r\\n\\t\\t</div>\\r\\n\\r\\n\\t\\t<!-- tabs -->\\r\\n\\t\\t<div class=\\"mt-5\\">\\r\\n\\t\\t\\t<!-- add story -->\\r\\n\\t\\t\\t{#if tabActive == 1}\\r\\n\\t\\t\\t\\t<div in:fly={{ x: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<p class=\\"display-5\\">Add a story</p>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row mt-3\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_title\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_title}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_title\\">The Title of your story</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{#if blog_imageURI}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-12 mb-1\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"width: 100%; height: 250px; object-fit: cover;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tsrc={blog_imageURI != ''\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t? blog_imageURI\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t: 'https://via.placeholder.com/1500?text=This+is+a+placeholder+image'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\talt=\\"...\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_imageUri\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_imageURI}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_imageUri\\">Story Header Image URL</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p class=\\"italic\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t*If you leave this blank, the site will generate a placeholder image\\r\\n\\t\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<textarea\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"min-height: 10em;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent text-white\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_content\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_content}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_content\\">Story content</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p class=\\"italic\\">*We prefer you to write the story content in HTML</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-12 mt-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check form-switch\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:checked={blog_visibility}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"checkbox\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"toggleVisibility\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"toggleVisibility\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{#if blog_visibility}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tExclusive Content\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tPublic Content\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col-12 mt-5\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button on:click={postBlog} class=\\"btn btn-primary\\">Post your story</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t\\t<!-- view stories -->\\r\\n\\t\\t\\t{#if tabActive == 2}\\r\\n\\t\\t\\t\\t<div in:fly={{ x: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<p class=\\"display-5\\">Your Stories</p>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row text-white\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if hasBlog == null}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"spinner-border text-info\\" role=\\"status\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"visually-hidden\\">Loading...</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t{#if !hasBlog || blogs.length < 1}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<h5>Seems like its empty</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<p>Make one of your own</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"mt-1 row row-cols-1 row-cols-md-2 g-3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{#each blogs as blog, index}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<AdminPostCard {blog} {index} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAoPC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Dashboard$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  supabase.auth.user();
  $$result.css.add(css$a);
  return `<svele:head><title>Dashboard | Abie G</title></svele:head>
<main style="${"margin-bottom: 10em;"}" class="${"svelte-xq1t9b"}"><div class="${"container text-white"}"><p class="${"display-3"}">Moderator Dashboard</p>

		<div class="${"btn-group mt-3 w-100"}"><button type="${"button"}" class="${"btn btn-lg btn-outline-primary"}">Add a Story</button>
			<button type="${"button"}" class="${"btn btn-lg btn-outline-primary"}">Your Stories</button></div>

		
		<div class="${"mt-5"}">
			${``}
			
			${`<div><p class="${"display-5"}">Your Stories</p>
					<div class="${"row text-white"}">${`<div class="${"spinner-border text-info"}" role="${"status"}"><span class="${"visually-hidden"}">Loading...</span></div>`}
						${`<div class="${"col-12"}"><h5>Seems like its empty</h5>
								<p>Make one of your own</p></div>`}</div></div>`}</div></div>
</main>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Dashboard$1
});
var css$9 = {
  code: "main.svelte-1w1ch6y.svelte-1w1ch6y{position:relative;min-height:100vh;margin-top:120px;z-index:3}.scroller.svelte-1w1ch6y.svelte-1w1ch6y{width:100vw;position:absolute;top:0%;left:0%;color:white;opacity:0.1;font-size:5rem;font-family:'Thunder Bold';user-select:none;z-index:-10}.lds-roller.svelte-1w1ch6y.svelte-1w1ch6y{display:inline-block;position:absolute;width:80px;height:80px;left:calc(50% - 40px);top:calc(50% - 40px)}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y{animation:svelte-1w1ch6y-lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;transform-origin:40px 40px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:after{content:' ';display:block;position:absolute;width:7px;height:7px;border-radius:50%;background:#fff;margin:-4px 0 0 -4px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(1){animation-delay:-0.036s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(1):after{top:63px;left:63px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(2){animation-delay:-0.072s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(2):after{top:68px;left:56px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(3){animation-delay:-0.108s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(3):after{top:71px;left:48px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(4){animation-delay:-0.144s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(4):after{top:72px;left:40px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(5){animation-delay:-0.18s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(5):after{top:71px;left:32px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(6){animation-delay:-0.216s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(6):after{top:68px;left:24px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(7){animation-delay:-0.252s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(7):after{top:63px;left:17px}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(8){animation-delay:-0.288s}.lds-roller.svelte-1w1ch6y div.svelte-1w1ch6y:nth-child(8):after{top:56px;left:12px}@keyframes svelte-1w1ch6y-lds-roller{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\timport { supabase, global_account, global_account_data } from '../../global';\\r\\n\\timport Post_BlogCard from '../../components/Post_BlogCard.svelte';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport PostBlogCard from '../../components/Post_BlogCard.svelte';\\r\\n\\r\\n\\tlet hasAccount = false;\\r\\n\\tlet blogs;\\r\\n\\tlet hasBlogs = null;\\r\\n\\tlet cardRow;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet msnry = new Masonry(cardRow, {\\r\\n\\t\\t\\titemSelector: '.thiscard',\\r\\n\\t\\t\\tcolumnWidth: '.thiscard',\\r\\n\\t\\t\\tpercentPosition: true,\\r\\n\\t\\t\\tgutter: 10\\r\\n\\t\\t});\\r\\n\\t\\tif (await supabase.auth.user()) {\\r\\n\\t\\t\\thasAccount = true;\\r\\n\\t\\t}\\r\\n\\t\\t(async (e) => {\\r\\n\\t\\t\\tif (hasAccount) {\\r\\n\\t\\t\\t\\tlet { data, error } = await supabase\\r\\n\\t\\t\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t\\t\\t.select('*')\\r\\n\\t\\t\\t\\t\\t.order('created_at', { ascending: false })\\r\\n\\t\\t\\t\\t\\t.range(0, 10);\\r\\n\\t\\t\\t\\thasBlogs = null;\\r\\n\\t\\t\\t\\tif (!error || data) {\\r\\n\\t\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\t\\thasBlogs = true;\\r\\n\\t\\t\\t\\t\\t}, 400);\\r\\n\\t\\t\\t\\t\\tblogs = data;\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\tif (data.length < 1) {\\r\\n\\t\\t\\t\\t\\thasBlogs = false;\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\tlet { data, error } = await supabase\\r\\n\\t\\t\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t\\t\\t.select('*')\\r\\n\\t\\t\\t\\t\\t.eq('isExclusive', 'false')\\r\\n\\t\\t\\t\\t\\t.order('created_at', { ascending: false })\\r\\n\\t\\t\\t\\t\\t.range(0, 10);\\r\\n\\t\\t\\t\\thasBlogs = null;\\r\\n\\t\\t\\t\\tif (!error || data) {\\r\\n\\t\\t\\t\\t\\thasBlogs = true;\\r\\n\\t\\t\\t\\t\\tblogs = data;\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\tif (data.length < 1) {\\r\\n\\t\\t\\t\\t\\thasBlogs = false;\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t}\\r\\n\\t\\t})();\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svele:head>\\r\\n\\t<title>Posts | Abie G</title>\\r\\n</svele:head>\\r\\n\\r\\n<main\\r\\n\\tclass=\\"mb-5\\"\\r\\n\\tin:fly={{ y: -40, duration: 500, delay: 500 }}\\r\\n\\tout:fly={{ y: 40, duration: 500 }}\\r\\n>\\r\\n\\t<div class=\\"container text-white\\">\\r\\n\\t\\t<h3 class=\\"display-3\\">See what's new</h3>\\r\\n\\r\\n\\t\\t<div class=\\" mt-5\\">\\r\\n\\t\\t\\t{#if hasBlogs == null}\\r\\n\\t\\t\\t\\t<div class=\\"lds-roller\\">\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t\\t<div />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{:else if hasBlogs}\\r\\n\\t\\t\\t\\t{#if !hasAccount}\\r\\n\\t\\t\\t\\t\\t<h4 class=\\"my-5\\">Sign in to view exclusive content</h4>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t<div bind:this={cardRow} class=\\"row row-cols-1 row-cols-md-2 row-cols-lg-3 gx-3 gy-3 \\">\\r\\n\\t\\t\\t\\t\\t{#each blogs as blogs}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col d-flex justify-content-center thiscard\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<PostBlogCard {...blogs} />\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t<h5>Seems like its empty</h5>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t\\t>SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp;</MarqueeTextWidget\\r\\n\\t\\t>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.scroller {\\r\\n\\t\\twidth: 100vw;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0%;\\r\\n\\t\\tleft: 0%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.1;\\r\\n\\t\\tfont-size: 5rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: -10;\\r\\n\\t}\\r\\n\\r\\n\\t/* custom loader */\\r\\n\\t.lds-roller {\\r\\n\\t\\tdisplay: inline-block;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\twidth: 80px;\\r\\n\\t\\theight: 80px;\\r\\n\\t\\tleft: calc(50% - 40px);\\r\\n\\t\\ttop: calc(50% - 40px);\\r\\n\\t}\\r\\n\\t.lds-roller div {\\r\\n\\t\\tanimation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;\\r\\n\\t\\ttransform-origin: 40px 40px;\\r\\n\\t}\\r\\n\\t.lds-roller div:after {\\r\\n\\t\\tcontent: ' ';\\r\\n\\t\\tdisplay: block;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\twidth: 7px;\\r\\n\\t\\theight: 7px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: #fff;\\r\\n\\t\\tmargin: -4px 0 0 -4px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(1) {\\r\\n\\t\\tanimation-delay: -0.036s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(1):after {\\r\\n\\t\\ttop: 63px;\\r\\n\\t\\tleft: 63px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(2) {\\r\\n\\t\\tanimation-delay: -0.072s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(2):after {\\r\\n\\t\\ttop: 68px;\\r\\n\\t\\tleft: 56px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(3) {\\r\\n\\t\\tanimation-delay: -0.108s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(3):after {\\r\\n\\t\\ttop: 71px;\\r\\n\\t\\tleft: 48px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(4) {\\r\\n\\t\\tanimation-delay: -0.144s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(4):after {\\r\\n\\t\\ttop: 72px;\\r\\n\\t\\tleft: 40px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(5) {\\r\\n\\t\\tanimation-delay: -0.18s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(5):after {\\r\\n\\t\\ttop: 71px;\\r\\n\\t\\tleft: 32px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(6) {\\r\\n\\t\\tanimation-delay: -0.216s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(6):after {\\r\\n\\t\\ttop: 68px;\\r\\n\\t\\tleft: 24px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(7) {\\r\\n\\t\\tanimation-delay: -0.252s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(7):after {\\r\\n\\t\\ttop: 63px;\\r\\n\\t\\tleft: 17px;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(8) {\\r\\n\\t\\tanimation-delay: -0.288s;\\r\\n\\t}\\r\\n\\t.lds-roller div:nth-child(8):after {\\r\\n\\t\\ttop: 56px;\\r\\n\\t\\tleft: 12px;\\r\\n\\t}\\r\\n\\t@keyframes lds-roller {\\r\\n\\t\\t0% {\\r\\n\\t\\t\\ttransform: rotate(0deg);\\r\\n\\t\\t}\\r\\n\\t\\t100% {\\r\\n\\t\\t\\ttransform: rotate(360deg);\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA6GC,IAAI,8BAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,SAAS,8BAAC,CAAC,AACV,KAAK,CAAE,KAAK,CACZ,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,EAAE,CACP,IAAI,CAAE,EAAE,CACR,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,GAAG,AACb,CAAC,AAGD,WAAW,8BAAC,CAAC,AACZ,OAAO,CAAE,YAAY,CACrB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,IAAI,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,CACtB,GAAG,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AACtB,CAAC,AACD,0BAAW,CAAC,GAAG,eAAC,CAAC,AAChB,SAAS,CAAE,yBAAU,CAAC,IAAI,CAAC,aAAa,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,QAAQ,CAChE,gBAAgB,CAAE,IAAI,CAAC,IAAI,AAC5B,CAAC,AACD,0BAAW,CAAC,kBAAG,MAAM,AAAC,CAAC,AACtB,OAAO,CAAE,GAAG,CACZ,OAAO,CAAE,KAAK,CACd,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,AACtB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,MAAM,AACxB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,AAAC,CAAC,AAC7B,eAAe,CAAE,OAAO,AACzB,CAAC,AACD,0BAAW,CAAC,kBAAG,WAAW,CAAC,CAAC,MAAM,AAAC,CAAC,AACnC,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,IAAI,AACX,CAAC,AACD,WAAW,yBAAW,CAAC,AACtB,EAAE,AAAC,CAAC,AACH,SAAS,CAAE,OAAO,IAAI,CAAC,AACxB,CAAC,AACD,IAAI,AAAC,CAAC,AACL,SAAS,CAAE,OAAO,MAAM,CAAC,AAC1B,CAAC,AACF,CAAC"}`
};
var Posts$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$9);
  return `<svele:head><title>Posts | Abie G</title></svele:head>

<main class="${"mb-5 svelte-1w1ch6y"}"><div class="${"container text-white"}"><h3 class="${"display-3"}">See what&#39;s new</h3>

		<div class="${"mt-5"}">${`<div class="${"lds-roller svelte-1w1ch6y"}"><div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div>
					<div class="${"svelte-1w1ch6y"}"></div></div>`}</div></div>
	<div class="${"scroller svelte-1w1ch6y"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `SEE WHAT&#39;S GOING ON \xA0 SEE WHAT&#39;S GOING ON \xA0 SEE WHAT&#39;S GOING ON \xA0`
  })}</div>
</main>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Posts$1
});
var css$8 = {
  code: "main.svelte-17uh9ph.svelte-17uh9ph{position:relative;min-height:100vh;z-index:3;animation:slide 500ms ease-out 200ms}.imgContainer.svelte-17uh9ph.svelte-17uh9ph{position:relative;top:0;width:100%;height:50vh;display:flex;justify-content:center;align-items:center;z-index:1;perspective:1px;opacity:1;overflow:hidden;transition:all 200ms ease;margin-bottom:5vh}.imgContainer.svelte-17uh9ph.svelte-17uh9ph:hover{height:60vh}.imgContainer.svelte-17uh9ph:hover .exlusiveContent.svelte-17uh9ph{opacity:0.4}.imgContainer.svelte-17uh9ph img.svelte-17uh9ph{position:absolute;width:100%;height:100%;object-fit:cover}.exlusiveContent.svelte-17uh9ph.svelte-17uh9ph{position:absolute;background:#d63384;bottom:0;right:0;min-height:50px;min-width:200px;height:20%;width:40%;font-size:2em;margin:0;border-top-left-radius:20px;border-top-right-radius:0px;box-shadow:rgba(0, 0, 0, 0.5) 0 0 20px;z-index:2;transition:all 200ms ease}.exlusiveContent.svelte-17uh9ph span.svelte-17uh9ph{position:absolute;bottom:10%;right:10%;margin:0}@media screen and (max-width: 800px){.exlusiveContent.svelte-17uh9ph.svelte-17uh9ph{width:100%;height:15%;border-top-left-radius:20px;border-top-right-radius:20px;font-size:1.5em}.imgContainer.svelte-17uh9ph.svelte-17uh9ph{border-top-left-radius:0;border-top-right-radius:0}.imgContainer.svelte-17uh9ph img.svelte-17uh9ph{width:200%}}",
  map: `{"version":3,"file":"SlugContent.svelte","sources":["SlugContent.svelte"],"sourcesContent":["<script>\\r\\n\\timport { slide, fly } from 'svelte/transition';\\r\\n\\timport { quintOut } from 'svelte/easing';\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\r\\n\\texport let blogData;\\r\\n\\r\\n\\tlet scrollY;\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY />\\r\\n\\r\\n<main>\\r\\n\\t<div>\\r\\n\\t\\t<div\\r\\n\\t\\t\\tclass=\\"imgContainer\\"\\r\\n\\t\\t\\tin:slide={{ duration: 800, easing: quintOut }}\\r\\n\\t\\t\\tout:fly={{ y: -20, duration: 500, easing: quintOut }}\\r\\n\\t\\t\\tstyle=\\"opacity: {1 - scrollY / 500}; transform: translateY(-{Math.min(\\r\\n\\t\\t\\t\\t(scrollY / 500) * 100,\\r\\n\\t\\t\\t\\t500\\r\\n\\t\\t\\t)}px);\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<img src={blogData.header_img} alt=\\"\\" />\\r\\n\\r\\n\\t\\t\\t{#if blogData.isExclusive}\\r\\n\\t\\t\\t\\t<h6\\r\\n\\t\\t\\t\\t\\tclass=\\"exlusiveContent text-white \\"\\r\\n\\t\\t\\t\\t\\tin:fly={{ y: 50, duration: 500, delay: 500, easing: quintOut }}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<span in:fly={{ y: 10, duration: 500, delay: 800, easing: quintOut }}>EXCLUSIVE</span>\\r\\n\\t\\t\\t\\t</h6>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t\\t<div\\r\\n\\t\\t\\tin:fly={{ y: 60, duration: 500, delay: 500 }}\\r\\n\\t\\t\\tout:fly={{ y: -60, duration: 500 }}\\r\\n\\t\\t\\tclass=\\"mb-5\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<div class=\\"container text-white\\">\\r\\n\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-8\\" />\\r\\n\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"col-sm-12 col-md-4 d-flex justify-content-end\\"\\r\\n\\t\\t\\t\\t\\t\\tin:fly={{ x: 20, duration: 500, delay: 1200 }}\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t<a href=\\"/posts\\" class=\\"btn btn-lg text-white bg-secondary \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"bi bi-x me-3\\" style=\\"font-size: 1.1em;\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<span>Close Article</span>\\r\\n\\t\\t\\t\\t\\t\\t</a>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"row mt-3\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if blogData}\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"display-1\\">{blogData.title}</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t<h5>by: {blogData.author} | {dayjs(blogData.createdAt).format('DD MMM, YYYY')}</h5>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col-12 mt-5\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if blogData}\\r\\n\\t\\t\\t\\t\\t\\t\\t<p class=\\"flow-text white-text\\">{@html blogData.content}</p>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  min-height: 100vh;\\n  z-index: 3;\\n  animation: slide 500ms ease-out 200ms;\\n}\\n\\n.imgContainer {\\n  position: relative;\\n  top: 0;\\n  width: 100%;\\n  height: 50vh;\\n  display: flex;\\n  justify-content: center;\\n  align-items: center;\\n  z-index: 1;\\n  perspective: 1px;\\n  opacity: 1;\\n  overflow: hidden;\\n  transition: all 200ms ease;\\n  margin-bottom: 5vh;\\n}\\n.imgContainer:hover {\\n  height: 60vh;\\n}\\n.imgContainer:hover .exlusiveContent {\\n  opacity: 0.4;\\n}\\n.imgContainer img {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  object-fit: cover;\\n}\\n\\n.exlusiveContent {\\n  position: absolute;\\n  background: #d63384;\\n  bottom: 0;\\n  right: 0;\\n  min-height: 50px;\\n  min-width: 200px;\\n  height: 20%;\\n  width: 40%;\\n  font-size: 2em;\\n  margin: 0;\\n  border-top-left-radius: 20px;\\n  border-top-right-radius: 0px;\\n  box-shadow: rgba(0, 0, 0, 0.5) 0 0 20px;\\n  z-index: 2;\\n  transition: all 200ms ease;\\n}\\n.exlusiveContent span {\\n  position: absolute;\\n  bottom: 10%;\\n  right: 10%;\\n  margin: 0;\\n}\\n\\n@media screen and (max-width: 800px) {\\n  .exlusiveContent {\\n    width: 100%;\\n    height: 15%;\\n    border-top-left-radius: 20px;\\n    border-top-right-radius: 20px;\\n    font-size: 1.5em;\\n  }\\n\\n  .imgContainer {\\n    border-top-left-radius: 0;\\n    border-top-right-radius: 0;\\n  }\\n  .imgContainer img {\\n    width: 200%;\\n  }\\n}</style>\\r\\n"],"names":[],"mappings":"AAsEmB,IAAI,8BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,KAAK,CAAC,KAAK,CAAC,QAAQ,CAAC,KAAK,AACvC,CAAC,AAED,aAAa,8BAAC,CAAC,AACb,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,CAAC,CACV,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,CAC1B,aAAa,CAAE,GAAG,AACpB,CAAC,AACD,2CAAa,MAAM,AAAC,CAAC,AACnB,MAAM,CAAE,IAAI,AACd,CAAC,AACD,4BAAa,MAAM,CAAC,gBAAgB,eAAC,CAAC,AACpC,OAAO,CAAE,GAAG,AACd,CAAC,AACD,4BAAa,CAAC,GAAG,eAAC,CAAC,AACjB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,gBAAgB,8BAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,CAAC,CACR,UAAU,CAAE,IAAI,CAChB,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,GAAG,CACX,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,GAAG,CACd,MAAM,CAAE,CAAC,CACT,sBAAsB,CAAE,IAAI,CAC5B,uBAAuB,CAAE,GAAG,CAC5B,UAAU,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CACvC,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,AAC5B,CAAC,AACD,+BAAgB,CAAC,IAAI,eAAC,CAAC,AACrB,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,GAAG,CACX,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,CAAC,AACX,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACpC,gBAAgB,8BAAC,CAAC,AAChB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CACX,sBAAsB,CAAE,IAAI,CAC5B,uBAAuB,CAAE,IAAI,CAC7B,SAAS,CAAE,KAAK,AAClB,CAAC,AAED,aAAa,8BAAC,CAAC,AACb,sBAAsB,CAAE,CAAC,CACzB,uBAAuB,CAAE,CAAC,AAC5B,CAAC,AACD,4BAAa,CAAC,GAAG,eAAC,CAAC,AACjB,KAAK,CAAE,IAAI,AACb,CAAC,AACH,CAAC"}`
};
var SlugContent = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { blogData } = $$props;
  let scrollY;
  if ($$props.blogData === void 0 && $$bindings.blogData && blogData !== void 0)
    $$bindings.blogData(blogData);
  $$result.css.add(css$8);
  return `

<main class="${"svelte-17uh9ph"}"><div><div class="${"imgContainer svelte-17uh9ph"}" style="${"opacity: " + escape(1 - scrollY / 500) + "; transform: translateY(-" + escape(Math.min(scrollY / 500 * 100, 500)) + "px);"}"><img${add_attribute("src", blogData.header_img, 0)} alt="${""}" class="${"svelte-17uh9ph"}">

			${blogData.isExclusive ? `<h6 class="${"exlusiveContent text-white  svelte-17uh9ph"}"><span class="${"svelte-17uh9ph"}">EXCLUSIVE</span></h6>` : ``}</div>
		<div class="${"mb-5"}"><div class="${"container text-white"}"><div class="${"row"}"><div class="${"col-sm-12 col-md-8"}"></div>
					<div class="${"col-sm-12 col-md-4 d-flex justify-content-end"}"><a href="${"/posts"}" class="${"btn btn-lg text-white bg-secondary "}"><i class="${"bi bi-x me-3"}" style="${"font-size: 1.1em;"}"></i>
							<span>Close Article</span></a></div></div>
				<div class="${"row mt-3"}"><div class="${"col-12"}">${blogData ? `<h3 class="${"display-1"}">${escape(blogData.title)}</h3>
							<h5>by: ${escape(blogData.author)} | ${escape((0, import_dayjs.default)(blogData.createdAt).format("DD MMM, YYYY"))}</h5>` : ``}</div>
					<div class="${"col-12 mt-5"}">${blogData ? `<p class="${"flow-text white-text"}"><!-- HTML_TAG_START -->${blogData.content}<!-- HTML_TAG_END --></p>` : ``}</div></div></div></div></div>
</main>`;
});
var SlugContent$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": SlugContent
});
var css$7 = {
  code: "main.svelte-19qb5yu{position:relative;min-height:86vh;z-index:3;animation:slide 500ms ease-out 200ms;display:flex;flex-direction:column;align-items:center;justify-content:center}",
  map: `{"version":3,"file":"[slug].svelte","sources":["[slug].svelte"],"sourcesContent":["<script context=\\"module\\">\\r\\n\\texport const load = async (e) => {\\r\\n\\t\\tlet slug = e.page.params.slug;\\r\\n\\t\\treturn { props: { slug } };\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { supabase } from '../../global';\\r\\n\\timport SlugContent from './components/SlugContent.svelte';\\r\\n\\r\\n\\texport let slug;\\r\\n\\texport let blogData;\\r\\n\\r\\n\\tlet title;\\r\\n\\tlet scrollY;\\r\\n\\tlet hasAccount = false;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet user = await supabase.auth.user();\\r\\n\\t\\tif (user) {\\r\\n\\t\\t\\thasAccount = true;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\tlet { data, error } = await supabase.from('posts').select('*').eq('id', slug);\\r\\n\\t\\tif (!error || data.length > 0) {\\r\\n\\t\\t\\tblogData = data[0];\\r\\n\\t\\t\\ttitle = data[0].title;\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svelte:window bind:scrollY />\\r\\n\\r\\n<svelte:head>\\r\\n\\t<title>ABIE G | {title}</title>\\r\\n</svelte:head>\\r\\n\\r\\n{#if blogData}\\r\\n\\t{#if blogData.isExclusive && hasAccount == false}\\r\\n\\t\\t<main>\\r\\n\\t\\t\\t<p class=\\"lead text-white\\">Please Sign in to view this page</p>\\r\\n\\t\\t</main>\\r\\n\\t{/if}\\r\\n\\t{#if (blogData.isExclusive && hasAccount) || (!blogData.isExclusive && !hasAccount) || (!blogData.isExclusive && hasAccount)}\\r\\n\\t\\t<SlugContent {blogData} />\\r\\n\\t{/if}\\r\\n{/if}\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  min-height: 86vh;\\n  z-index: 3;\\n  animation: slide 500ms ease-out 200ms;\\n  display: flex;\\n  flex-direction: column;\\n  align-items: center;\\n  justify-content: center;\\n}</style>\\r\\n"],"names":[],"mappings":"AAkDmB,IAAI,eAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,KAAK,CAAC,KAAK,CAAC,QAAQ,CAAC,KAAK,CACrC,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,AACzB,CAAC"}`
};
var load = async (e) => {
  let slug = e.page.params.slug;
  return { props: { slug } };
};
var U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slug } = $$props;
  let { blogData } = $$props;
  let title;
  let hasAccount = false;
  if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
    $$bindings.slug(slug);
  if ($$props.blogData === void 0 && $$bindings.blogData && blogData !== void 0)
    $$bindings.blogData(blogData);
  $$result.css.add(css$7);
  return `

${$$result.head += `${$$result.title = `<title>ABIE G | ${escape(title)}</title>`, ""}`, ""}

${blogData ? `${blogData.isExclusive && hasAccount == false ? `<main class="${"svelte-19qb5yu"}"><p class="${"lead text-white"}">Please Sign in to view this page</p></main>` : ``}
	${blogData.isExclusive && hasAccount || !blogData.isExclusive && !hasAccount || !blogData.isExclusive && hasAccount ? `${validate_component(SlugContent, "SlugContent").$$render($$result, { blogData }, {}, {})}` : ``}` : ``}`;
});
var _slug_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bslugu5D,
  load
});
var css$6 = {
  code: "main.svelte-rplqxt{position:relative;min-height:100vh;margin-top:120px;z-index:3}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\r\\n\\timport { SvelteToast } from '@zerodevx/svelte-toast';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase, global_account_data, global_account } from '../../global';\\r\\n\\r\\n\\tlet user,\\r\\n\\t\\t_status = 'Please standby as we check for an existing account',\\r\\n\\t\\t_isValidated = false;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tuser = await supabase.auth.user();\\r\\n\\t\\tif (user) {\\r\\n\\t\\t\\tsetTimeout(async () => {\\r\\n\\t\\t\\t\\t_status = 'Account detected';\\r\\n\\t\\t\\t\\tlet { data: users, error } = await supabase.from('users').select('*').eq('id', user.id);\\r\\n\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\tconsole.log(users);\\r\\n\\t\\t\\t\\t\\tif (users[0].isAdmin) {\\r\\n\\t\\t\\t\\t\\t\\t_status = 'Redirecting to dashboard';\\r\\n\\t\\t\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tgoto('/root/dashboard');\\r\\n\\t\\t\\t\\t\\t\\t}, 2000);\\r\\n\\t\\t\\t\\t\\t} else {\\r\\n\\t\\t\\t\\t\\t\\t_status = 'Account is not authorized to proceed further. Redirecting to home page';\\r\\n\\t\\t\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tgoto('/');\\r\\n\\t\\t\\t\\t\\t\\t}, 2000);\\r\\n\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t}, 1000);\\r\\n\\t\\t\\t}, 1000);\\r\\n\\t\\t} else {\\r\\n\\t\\t\\t_status = 'Account cannot be verified';\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\tgoto('/');\\r\\n\\t\\t\\t}, 1000);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<SvelteToast options={{ duration: 4000 }} />\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>\\r\\n\\t<div class=\\"container text-white\\">\\r\\n\\t\\t<h1 class=\\"display-3\\">Root User Access</h1>\\r\\n\\t\\t<div\\r\\n\\t\\t\\tstyle=\\"margin-top: 25vh;\\"\\r\\n\\t\\t\\tclass=\\"d-flex flex-column align-items-center justify-content-center\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<p>{_status}</p>\\r\\n\\t\\t\\t<div class=\\"spinner-border\\" role=\\"status\\">\\r\\n\\t\\t\\t\\t<span class=\\"visually-hidden\\">Loading...</span>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  min-height: 100vh;\\n  margin-top: 120px;\\n  z-index: 3;\\n}</style>\\r\\n"],"names":[],"mappings":"AA0DmB,IAAI,cAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let _status = "Please standby as we check for an existing account";
  $$result.css.add(css$6);
  return `${validate_component(SvelteToast, "SvelteToast").$$render($$result, { options: { duration: 4e3 } }, {}, {})}
<main class="${"svelte-rplqxt"}"><div class="${"container text-white"}"><h1 class="${"display-3"}">Root User Access</h1>
		<div style="${"margin-top: 25vh;"}" class="${"d-flex flex-column align-items-center justify-content-center"}"><p>${escape(_status)}</p>
			<div class="${"spinner-border"}" role="${"status"}"><span class="${"visually-hidden"}">Loading...</span></div></div></div>
</main>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Root
});
var Root_ModRequest_Card = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { thisuser, index: index2 } = $$props;
  if ($$props.thisuser === void 0 && $$bindings.thisuser && thisuser !== void 0)
    $$bindings.thisuser(thisuser);
  if ($$props.index === void 0 && $$bindings.index && index2 !== void 0)
    $$bindings.index(index2);
  return `<div class="${"card rounded-3 shadow-sm card1 p-1 mb-2 bg-transparent"}" style="${"user-select: none;"}"><div class="${"card-body"}"><div class="${"d-flex align-items-center justify-content-between"}"><p class="${"m-0 d-flex align-items-center"}">${escape(thisuser.email)}</p>
			<button class="${"btn btn-success"}">Approve</button></div></div></div>`;
});
var css$5 = {
  code: "main.svelte-1oj9r5s.svelte-1oj9r5s{position:relative;margin-top:50px;z-index:3}.card.svelte-1oj9r5s.svelte-1oj9r5s{overflow:hidden;background:#282c31}.card.svelte-1oj9r5s .card-body.svelte-1oj9r5s{position:relative}.card.svelte-1oj9r5s .card-body i.svelte-1oj9r5s{position:absolute;top:50%;opacity:0.2;transform:translateY(-50%);right:0%;font-size:10em}",
  map: `{"version":3,"file":"moderatorRequest.svelte","sources":["moderatorRequest.svelte"],"sourcesContent":["<script>\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\timport RootModRequestCard from '../../../components/Root_ModRequest_Card.svelte';\\r\\n\\r\\n\\tlet _users = [];\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet { data: users, error } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*')\\r\\n\\t\\t\\t.eq('isRequestingModAccount', 'true');\\r\\n\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\t_users = users;\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: 20, duration: 500 }} class=\\"text-white\\">\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t<h5>Moderator Request</h5>\\r\\n\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_users.length}</h1>\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-arrow-up-right-circle\\" />\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container mt-5\\">\\r\\n\\t\\t<h5>All Requests</h5>\\r\\n\\t\\t{#each _users as thisuser, index}\\r\\n\\t\\t\\t<RootModRequestCard {thisuser} {index} />\\r\\n\\t\\t{/each}\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 50px;\\n  z-index: 3;\\n}\\n\\n.card {\\n  overflow: hidden;\\n  background: #282c31;\\n}\\n.card .card-body {\\n  position: relative;\\n}\\n.card .card-body i {\\n  position: absolute;\\n  top: 50%;\\n  opacity: 0.2;\\n  transform: translateY(-50%);\\n  right: 0%;\\n  font-size: 10em;\\n}</style>\\r\\n"],"names":[],"mappings":"AAuCmB,IAAI,8BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,KAAK,8BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,AACrB,CAAC,AACD,oBAAK,CAAC,UAAU,eAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,AACpB,CAAC,AACD,oBAAK,CAAC,UAAU,CAAC,CAAC,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,EAAE,CACT,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var ModeratorRequest = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let _users = [];
  $$result.css.add(css$5);
  return `<main class="${"text-white svelte-1oj9r5s"}"><div class="${"container"}"><div class="${"card border-3 rounded-3 shadow-sm svelte-1oj9r5s"}"><div class="${"card-body svelte-1oj9r5s"}"><h5>Moderator Request</h5>
				<h1 class="${"mt-4"}">${escape(_users.length)}</h1>
				<i class="${"bi bi-arrow-up-right-circle svelte-1oj9r5s"}"></i></div></div></div>
	<div class="${"container mt-5"}"><h5>All Requests</h5>
		${each(_users, (thisuser, index2) => `${validate_component(Root_ModRequest_Card, "RootModRequestCard").$$render($$result, { thisuser, index: index2 }, {}, {})}`)}</div>
</main>`;
});
var moderatorRequest = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ModeratorRequest
});
var css$4 = {
  code: "main.svelte-1oj9r5s.svelte-1oj9r5s{position:relative;margin-top:50px;z-index:3}.card.svelte-1oj9r5s.svelte-1oj9r5s{overflow:hidden;background:#282c31}.card.svelte-1oj9r5s .card-body.svelte-1oj9r5s{position:relative}.card.svelte-1oj9r5s .card-body i.svelte-1oj9r5s{position:absolute;top:50%;opacity:0.2;transform:translateY(-50%);right:0%;font-size:10em}",
  map: `{"version":3,"file":"registeredUsers.svelte","sources":["registeredUsers.svelte"],"sourcesContent":["<script>\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\timport RootRegisteredUserCard from '../../../components/Root_RegisteredUser_Card.svelte';\\r\\n\\r\\n\\tlet _users = [];\\r\\n\\tlet loaded = false;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet { data: users, error } = await supabase.from('users').select('*');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\t_users = users;\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t// console.log(users);\\r\\n\\t\\t\\t\\tloaded = true;\\r\\n\\t\\t\\t}, 200);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: 20, duration: 500 }} class=\\"text-white\\">\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t<h5>Registered Members</h5>\\r\\n\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_users.length}</h1>\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-person-circle\\" />\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\r\\n\\t<div class=\\"container mt-5 \\">\\r\\n\\t\\t<p class=\\"display-6\\">List of users</p>\\r\\n\\t\\t<div class=\\"row row-cols-lg-2\\">\\r\\n\\t\\t\\t{#if loaded}\\r\\n\\t\\t\\t\\t{#each _users as thisuser, index}\\r\\n\\t\\t\\t\\t\\t<RootRegisteredUserCard {thisuser} {index} />\\r\\n\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t<div class=\\"d-flex align-items-center\\">\\r\\n\\t\\t\\t\\t\\t<strong>Loading...</strong>\\r\\n\\t\\t\\t\\t\\t<div class=\\"spinner-border ms-auto\\" role=\\"status\\" aria-hidden=\\"true\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 50px;\\n  z-index: 3;\\n}\\n\\n.card {\\n  overflow: hidden;\\n  background: #282c31;\\n}\\n.card .card-body {\\n  position: relative;\\n}\\n.card .card-body i {\\n  position: absolute;\\n  top: 50%;\\n  opacity: 0.2;\\n  transform: translateY(-50%);\\n  right: 0%;\\n  font-size: 10em;\\n}</style>\\r\\n"],"names":[],"mappings":"AAmDmB,IAAI,8BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,KAAK,8BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,AACrB,CAAC,AACD,oBAAK,CAAC,UAAU,eAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,AACpB,CAAC,AACD,oBAAK,CAAC,UAAU,CAAC,CAAC,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,EAAE,CACT,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var RegisteredUsers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let _users = [];
  $$result.css.add(css$4);
  return `<main class="${"text-white svelte-1oj9r5s"}"><div class="${"container"}"><div class="${"card border-3 rounded-3 shadow-sm svelte-1oj9r5s"}"><div class="${"card-body svelte-1oj9r5s"}"><h5>Registered Members</h5>
				<h1 class="${"mt-4"}">${escape(_users.length)}</h1>
				<i class="${"bi bi-person-circle svelte-1oj9r5s"}"></i></div></div></div>

	<div class="${"container mt-5 "}"><p class="${"display-6"}">List of users</p>
		<div class="${"row row-cols-lg-2"}">${`<div class="${"d-flex align-items-center"}"><strong>Loading...</strong>
					<div class="${"spinner-border ms-auto"}" role="${"status"}" aria-hidden="${"true"}"></div></div>`}</div></div>
</main>`;
});
var registeredUsers = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": RegisteredUsers
});
var css$3 = {
  code: "main.svelte-1oj9r5s.svelte-1oj9r5s{position:relative;margin-top:50px;z-index:3}.card.svelte-1oj9r5s.svelte-1oj9r5s{overflow:hidden;background:#282c31}.card.svelte-1oj9r5s .card-body.svelte-1oj9r5s{position:relative}.card.svelte-1oj9r5s .card-body i.svelte-1oj9r5s{position:absolute;top:50%;opacity:0.2;transform:translateY(-50%);right:0%;font-size:10em}",
  map: `{"version":3,"file":"moderators.svelte","sources":["moderators.svelte"],"sourcesContent":["<script>\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\timport RootModeratorsCard from '../../../components/Root_Moderators_Card.svelte';\\r\\n\\r\\n\\tlet _users = [];\\r\\n\\tlet loaded = false;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet { data: users, error } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*')\\r\\n\\t\\t\\t.filter('isModerator', 'eq', 'true');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\t_users = users;\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t// console.log(users);\\r\\n\\t\\t\\t\\tloaded = true;\\r\\n\\t\\t\\t}, 200);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: 20, duration: 500 }} class=\\"text-white\\">\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t<h5>Verified Moderators</h5>\\r\\n\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_users.length}</h1>\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-pencil-square\\" />\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\r\\n\\t<div class=\\"container mt-5\\">\\r\\n\\t\\t<p class=\\"display-6\\">List of moderators</p>\\r\\n\\t\\t<div class=\\"row row-cols-md-2\\">\\r\\n\\t\\t\\t{#if loaded}\\r\\n\\t\\t\\t\\t{#each _users as thisuser, index}\\r\\n\\t\\t\\t\\t\\t<RootModeratorsCard {thisuser} {index} />\\r\\n\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t<div class=\\"d-flex align-items-center\\">\\r\\n\\t\\t\\t\\t\\t<strong>Loading...</strong>\\r\\n\\t\\t\\t\\t\\t<div class=\\"spinner-border ms-auto\\" role=\\"status\\" aria-hidden=\\"true\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 50px;\\n  z-index: 3;\\n}\\n\\n.card {\\n  overflow: hidden;\\n  background: #282c31;\\n}\\n.card .card-body {\\n  position: relative;\\n}\\n.card .card-body i {\\n  position: absolute;\\n  top: 50%;\\n  opacity: 0.2;\\n  transform: translateY(-50%);\\n  right: 0%;\\n  font-size: 10em;\\n}</style>\\r\\n"],"names":[],"mappings":"AAsDmB,IAAI,8BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,KAAK,8BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,AACrB,CAAC,AACD,oBAAK,CAAC,UAAU,eAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,AACpB,CAAC,AACD,oBAAK,CAAC,UAAU,CAAC,CAAC,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,EAAE,CACT,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var Moderators = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let _users = [];
  $$result.css.add(css$3);
  return `<main class="${"text-white svelte-1oj9r5s"}"><div class="${"container"}"><div class="${"card border-3 rounded-3 shadow-sm svelte-1oj9r5s"}"><div class="${"card-body svelte-1oj9r5s"}"><h5>Verified Moderators</h5>
				<h1 class="${"mt-4"}">${escape(_users.length)}</h1>
				<i class="${"bi bi-pencil-square svelte-1oj9r5s"}"></i></div></div></div>

	<div class="${"container mt-5"}"><p class="${"display-6"}">List of moderators</p>
		<div class="${"row row-cols-md-2"}">${`<div class="${"d-flex align-items-center"}"><strong>Loading...</strong>
					<div class="${"spinner-border ms-auto"}" role="${"status"}" aria-hidden="${"true"}"></div></div>`}</div></div>
</main>`;
});
var moderators = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Moderators
});
var css$2 = {
  code: "main.svelte-tew7yr.svelte-tew7yr{position:relative;margin-top:50px;z-index:3}.card.svelte-tew7yr.svelte-tew7yr{overflow:hidden;background:#282c31}.card.svelte-tew7yr .card-body.svelte-tew7yr{position:relative}.card.svelte-tew7yr .card-body i.svelte-tew7yr{position:absolute;top:50%;opacity:0.2;transform:translateY(-50%);right:-2%;font-size:10em}",
  map: `{"version":3,"file":"overview.svelte","sources":["overview.svelte"],"sourcesContent":["<script>\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\r\\n\\tlet registeredMembers = 0;\\r\\n\\tlet registeredMods = 0;\\r\\n\\tlet modRequest = 0;\\r\\n\\tlet allPosts = 0;\\r\\n\\tlet publicPosts = 0;\\r\\n\\tlet exclusivePosts = 0;\\r\\n\\r\\n\\tconst getRegisteredMembers = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*', { count: 'exact' });\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tregisteredMembers = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst getRegisteredMods = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*', { count: 'exact' })\\r\\n\\t\\t\\t.eq('isModerator', 'true');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tregisteredMods = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst getModRequest = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*', { count: 'exact' })\\r\\n\\t\\t\\t.eq('isRequestingModAccount', 'true');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tmodRequest = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst getAllPosts = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t.select('*', { count: 'exact' });\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tallPosts = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst getPublicPosts = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t.select('*', { count: 'exact' })\\r\\n\\t\\t\\t.eq('isExclusive', 'false');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tpublicPosts = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst getExclusivePosts = async (e) => {\\r\\n\\t\\tlet { data: users, error, count } = await supabase\\r\\n\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t.select('*', { count: 'exact' })\\r\\n\\t\\t\\t.eq('isExclusive', 'true');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\texclusivePosts = count;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tgetRegisteredMembers();\\r\\n\\t\\tgetRegisteredMods();\\r\\n\\t\\tgetAllPosts();\\r\\n\\t\\tgetPublicPosts();\\r\\n\\t\\tgetExclusivePosts();\\r\\n\\t\\tgetModRequest();\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: 20, duration: 500 }}>\\r\\n\\t<div class=\\"container text-white\\">\\r\\n\\t\\t<div class=\\"row row-cols-1 row-cols-md-2\\">\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Registered Members</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{registeredMembers ? registeredMembers : 'Loading...'}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-person-circle\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12 col-md-6\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Registered Moderators</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{registeredMods ? registeredMods : 'Loading...'}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-pencil-square\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12 col-md-6\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Moderator Request</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{modRequest}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-arrow-up-right-circle\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t\\t<div class=\\"row row-cols-1 row-cols-md-3 mt-5\\">\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Published Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{allPosts ? allPosts : 'Loading...'}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-sticky\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12 col-md-6\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Public Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{publicPosts ? publicPosts : 'Loading...'}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-globe2\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm col-12 col-md-6\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Exclusive Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{exclusivePosts ? exclusivePosts : 'Loading...'}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-file-lock\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 50px;\\n  z-index: 3;\\n}\\n\\n.card {\\n  overflow: hidden;\\n  background: #282c31;\\n}\\n.card .card-body {\\n  position: relative;\\n}\\n.card .card-body i {\\n  position: absolute;\\n  top: 50%;\\n  opacity: 0.2;\\n  transform: translateY(-50%);\\n  right: -2%;\\n  font-size: 10em;\\n}</style>\\r\\n"],"names":[],"mappings":"AA+HmB,IAAI,4BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,KAAK,4BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,AACrB,CAAC,AACD,mBAAK,CAAC,UAAU,cAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,AACpB,CAAC,AACD,mBAAK,CAAC,UAAU,CAAC,CAAC,cAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var Overview = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let modRequest = 0;
  $$result.css.add(css$2);
  return `<main class="${"svelte-tew7yr"}"><div class="${"container text-white"}"><div class="${"row row-cols-1 row-cols-md-2"}"><div class="${"card border-3 rounded-3 shadow-sm col-12 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Registered Members</h5>
					<h1 class="${"mt-4"}">${escape("Loading...")}</h1>
					<i class="${"bi bi-person-circle svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm col-12 col-md-6 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Registered Moderators</h5>
					<h1 class="${"mt-4"}">${escape("Loading...")}</h1>
					<i class="${"bi bi-pencil-square svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm col-12 col-md-6 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Moderator Request</h5>
					<h1 class="${"mt-4"}">${escape(modRequest)}</h1>
					<i class="${"bi bi-arrow-up-right-circle svelte-tew7yr"}"></i></div></div></div>
		<div class="${"row row-cols-1 row-cols-md-3 mt-5"}"><div class="${"card border-3 rounded-3 shadow-sm col-12 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Published Posts</h5>
					<h1 class="${"mt-4"}">${escape("Loading...")}</h1>
					<i class="${"bi bi-sticky svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm col-12 col-md-6 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Public Posts</h5>
					<h1 class="${"mt-4"}">${escape("Loading...")}</h1>
					<i class="${"bi bi-globe2 svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm col-12 col-md-6 svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Exclusive Posts</h5>
					<h1 class="${"mt-4"}">${escape("Loading...")}</h1>
					<i class="${"bi bi-file-lock svelte-tew7yr"}"></i></div></div></div></div>
</main>`;
});
var overview = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Overview
});
var css$1 = {
  code: "main.svelte-tew7yr.svelte-tew7yr{position:relative;margin-top:50px;z-index:3}.card.svelte-tew7yr.svelte-tew7yr{overflow:hidden;background:#282c31}.card.svelte-tew7yr .card-body.svelte-tew7yr{position:relative}.card.svelte-tew7yr .card-body i.svelte-tew7yr{position:absolute;top:50%;opacity:0.2;transform:translateY(-50%);right:-2%;font-size:10em}",
  map: `{"version":3,"file":"posts.svelte","sources":["posts.svelte"],"sourcesContent":["<script>\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\timport AdminPostCard from '../../../components/AdminPostCard.svelte';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport { supabase } from '../../../global';\\r\\n\\r\\n\\tlet _posts = [];\\r\\n\\tlet _public_posts = [];\\r\\n\\tlet _exclusive_posts = [];\\r\\n\\tlet loaded = false;\\r\\n\\tlet post_toggler = 1;\\r\\n\\r\\n\\tconst getData = async (e) => {\\r\\n\\t\\tlet { data: posts, error } = await supabase.from('posts').select('*');\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\t_posts = posts;\\r\\n\\t\\t\\tposts.forEach((thispost) => {\\r\\n\\t\\t\\t\\tif (thispost.isExclusive == false) {\\r\\n\\t\\t\\t\\t\\t_public_posts = [..._public_posts, thispost];\\r\\n\\t\\t\\t\\t} else {\\r\\n\\t\\t\\t\\t\\t_exclusive_posts = [..._exclusive_posts, thispost];\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t});\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\tloaded = true;\\r\\n\\t\\t\\t}, 200);\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tgetData();\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: 20, duration: 500 }} class=\\"text-white\\">\\r\\n\\t<div class=\\"container \\">\\r\\n\\t\\t<div class=\\"row row-cols-md-3\\">\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>All Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_posts.length}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-eye\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Public Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_public_posts.length}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-globe2\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"card border-3 rounded-3 shadow-sm\\">\\r\\n\\t\\t\\t\\t<div class=\\"card-body\\">\\r\\n\\t\\t\\t\\t\\t<h5>Exclusive Posts</h5>\\r\\n\\t\\t\\t\\t\\t<h1 class=\\"mt-4\\">{_exclusive_posts.length}</h1>\\r\\n\\t\\t\\t\\t\\t<i class=\\"bi bi-file-lock\\" />\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t{#if loaded}\\r\\n\\t\\t<div class=\\"container mt-5\\" in:fly={{ y: 20, duration: 500 }}>\\r\\n\\t\\t\\t<div class=\\"btn-group d-flex\\" role=\\"group\\" aria-label=\\"Basic example\\">\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\tpost_toggler = 1;\\r\\n\\t\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\t\\tclass=\\"btn btn-outline-primary\\">List of All Posts</button\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\tpost_toggler = 2;\\r\\n\\t\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\t\\tclass=\\"btn btn-outline-primary\\">List of Public Posts</button\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\tpost_toggler = 3;\\r\\n\\t\\t\\t\\t\\t}}\\r\\n\\t\\t\\t\\t\\tclass=\\"btn btn-outline-primary\\">List of Exclusive Posts</button\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"mt-3 \\">\\r\\n\\t\\t\\t\\t{#if post_toggler == 1}\\r\\n\\t\\t\\t\\t\\t<div in:fly={{ y: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"display-5 mt-5\\">All Posts</p>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row row-cols-1 row-cols-md-2\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each _posts as thispost}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<AdminPostCard blog={thispost} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t{#if post_toggler == 2}\\r\\n\\t\\t\\t\\t\\t<div in:fly={{ y: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"display-5 mt-5\\">Public Posts</p>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row row-cols-1 row-cols-md-2\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each _public_posts as thispost}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<AdminPostCard blog={thispost} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t{#if post_toggler == 3}\\r\\n\\t\\t\\t\\t\\t<div in:fly={{ y: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t\\t<p class=\\"display-5 mt-5\\">Exclusive Posts Posts</p>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row row-cols-1 row-cols-md-2\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each _exclusive_posts as thispost}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<AdminPostCard blog={thispost} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</main>\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  margin-top: 50px;\\n  z-index: 3;\\n}\\n\\n.card {\\n  overflow: hidden;\\n  background: #282c31;\\n}\\n.card .card-body {\\n  position: relative;\\n}\\n.card .card-body i {\\n  position: absolute;\\n  top: 50%;\\n  opacity: 0.2;\\n  transform: translateY(-50%);\\n  right: -2%;\\n  font-size: 10em;\\n}</style>\\r\\n"],"names":[],"mappings":"AA2HmB,IAAI,4BAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,KAAK,4BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,AACrB,CAAC,AACD,mBAAK,CAAC,UAAU,cAAC,CAAC,AAChB,QAAQ,CAAE,QAAQ,AACpB,CAAC,AACD,mBAAK,CAAC,UAAU,CAAC,CAAC,cAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,IAAI,AACjB,CAAC"}`
};
var Posts = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let _posts = [];
  let _public_posts = [];
  let _exclusive_posts = [];
  $$result.css.add(css$1);
  return `<main class="${"text-white svelte-tew7yr"}"><div class="${"container "}"><div class="${"row row-cols-md-3"}"><div class="${"card border-3 rounded-3 shadow-sm svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>All Posts</h5>
					<h1 class="${"mt-4"}">${escape(_posts.length)}</h1>
					<i class="${"bi bi-eye svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Public Posts</h5>
					<h1 class="${"mt-4"}">${escape(_public_posts.length)}</h1>
					<i class="${"bi bi-globe2 svelte-tew7yr"}"></i></div></div>
			<div class="${"card border-3 rounded-3 shadow-sm svelte-tew7yr"}"><div class="${"card-body svelte-tew7yr"}"><h5>Exclusive Posts</h5>
					<h1 class="${"mt-4"}">${escape(_exclusive_posts.length)}</h1>
					<i class="${"bi bi-file-lock svelte-tew7yr"}"></i></div></div></div></div>
	${``}
</main>`;
});
var posts = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Posts
});
var css = {
  code: "main.svelte-rplqxt{position:relative;min-height:100vh;margin-top:120px;z-index:3}",
  map: `{"version":3,"file":"dashboard.svelte","sources":["dashboard.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly } from 'svelte/transition';\\r\\n\\timport Moderators from './components/moderators.svelte';\\r\\n\\timport Overview from './components/overview.svelte';\\r\\n\\timport Posts from './components/posts.svelte';\\r\\n\\timport RegisteredUsers from './components/registeredUsers.svelte';\\r\\n\\timport ModeratorRequest from './components/moderatorRequest.svelte';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { supabase } from '../../global';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\r\\n\\tlet activeTab = 1;\\r\\n\\r\\n\\tlet isAccessible = null;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet user = await supabase.auth.user();\\r\\n\\r\\n\\t\\tif (user) {\\r\\n\\t\\t\\tlet { data, error } = await supabase.from('users').select('isAdmin').eq('id', user.id);\\r\\n\\t\\t\\t// alert(JSON.stringify(data[0]));\\r\\n\\t\\t\\tif (data[0].isAdmin) {\\r\\n\\t\\t\\t\\tisAccessible = true;\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\tisAccessible = false;\\r\\n\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\tgoto('/');\\r\\n\\t\\t\\t\\t}, 2000);\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tisAccessible = false;\\r\\n\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\tgoto('/');\\r\\n\\t\\t\\t}, 2000);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n{#if isAccessible}\\r\\n\\t<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>\\r\\n\\t\\t<div class=\\"container text-white\\">\\r\\n\\t\\t\\t<p class=\\"display-3\\">Root Dashboard</p>\\r\\n\\t\\t\\t<div class=\\"mt-2\\">\\r\\n\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\tclass=\\"btn-group d-none d-md-flex justify-content-center\\"\\r\\n\\t\\t\\t\\t\\trole=\\"group\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Basic outlined example\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 1;\\r\\n\\t\\t\\t\\t\\t\\t}}>Overview</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 5;\\r\\n\\t\\t\\t\\t\\t\\t}}>Posts</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\tclass=\\"btn-group d-none d-md-flex justify-content-center\\"\\r\\n\\t\\t\\t\\t\\trole=\\"group\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Basic outlined example\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 3;\\r\\n\\t\\t\\t\\t\\t\\t}}>Moderators</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 4;\\r\\n\\t\\t\\t\\t\\t\\t}}>Moderator Request</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 2;\\r\\n\\t\\t\\t\\t\\t\\t}}>Registered Members</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\tclass=\\"btn-group d-flex d-md-none justify-content-center\\"\\r\\n\\t\\t\\t\\t\\trole=\\"group\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Basic outlined example\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 1;\\r\\n\\t\\t\\t\\t\\t\\t}}>Overview</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\tclass=\\"btn-group d-flex d-md-none justify-content-center\\"\\r\\n\\t\\t\\t\\t\\trole=\\"group\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Basic outlined example\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 3;\\r\\n\\t\\t\\t\\t\\t\\t}}>Moderators</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 2;\\r\\n\\t\\t\\t\\t\\t\\t}}>Registered Members</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\tclass=\\"btn-group d-flex d-md-none justify-content-center\\"\\r\\n\\t\\t\\t\\t\\trole=\\"group\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Basic outlined example\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 4;\\r\\n\\t\\t\\t\\t\\t\\t}}>Moderator Request</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"btn btn-outline-light\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => {\\r\\n\\t\\t\\t\\t\\t\\t\\tactiveTab = 5;\\r\\n\\t\\t\\t\\t\\t\\t}}>Posts</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\r\\n\\t\\t<!-- overview -->\\r\\n\\t\\t{#if activeTab == 1}\\r\\n\\t\\t\\t<Overview />\\r\\n\\t\\t{/if}\\r\\n\\t\\t{#if activeTab == 2}\\r\\n\\t\\t\\t<RegisteredUsers />\\r\\n\\t\\t{/if}\\r\\n\\t\\t{#if activeTab == 3}\\r\\n\\t\\t\\t<Moderators />\\r\\n\\t\\t{/if}\\r\\n\\t\\t{#if activeTab == 4}\\r\\n\\t\\t\\t<ModeratorRequest />\\r\\n\\t\\t{/if}\\r\\n\\t\\t{#if activeTab == 5}\\r\\n\\t\\t\\t<Posts />\\r\\n\\t\\t{/if}\\r\\n\\t</main>\\r\\n{:else if isAccessible == null}\\r\\n\\t<main\\r\\n\\t\\tclass=\\"text-white d-flex flex-column align-items-center justify-content-center\\"\\r\\n\\t\\tstyle=\\"margin-top: 0;\\"\\r\\n\\t\\tin:fly={{ y: -40, duration: 500, delay: 500 }}\\r\\n\\t\\tout:fly={{ y: 40, duration: 500 }}\\r\\n\\t>\\r\\n\\t\\t<div class=\\"spinner-border\\" role=\\"status\\">\\r\\n\\t\\t\\t<span class=\\"visually-hidden\\">Loading...</span>\\r\\n\\t\\t</div>\\r\\n\\t</main>\\r\\n{:else if isAccessible == false}\\r\\n\\t<main\\r\\n\\t\\tclass=\\"text-white d-flex flex-column align-items-center justify-content-center\\"\\r\\n\\t\\tstyle=\\"margin-top: 0;\\"\\r\\n\\t\\tin:fly={{ y: -40, duration: 500, delay: 500 }}\\r\\n\\t\\tout:fly={{ y: 40, duration: 500 }}\\r\\n\\t>\\r\\n\\t\\t<i class=\\"bi bi-exclamation-diamond\\" style=\\"font-size: 10rem;\\" />\\r\\n\\t\\t<p class=\\"lead\\">You are not a root user to access this page</p>\\r\\n\\t</main>\\r\\n{/if}\\r\\n\\r\\n<style lang=\\"scss\\">main {\\n  position: relative;\\n  min-height: 100vh;\\n  margin-top: 120px;\\n  z-index: 3;\\n}</style>\\r\\n"],"names":[],"mappings":"AA0LmB,IAAI,cAAC,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACZ,CAAC"}`
};
var Dashboard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${`${`<main class="${"text-white d-flex flex-column align-items-center justify-content-center svelte-rplqxt"}" style="${"margin-top: 0;"}"><div class="${"spinner-border"}" role="${"status"}"><span class="${"visually-hidden"}">Loading...</span></div></main>`}`}`;
});
var dashboard = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Dashboard
});

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*!
 * Toastify js 1.11.2
 * https://github.com/apvarun/toastify-js
 * @license MIT licensed
 *
 * Copyright (C) 2018 Varun A P
 */
