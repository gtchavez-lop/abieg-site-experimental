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

// node_modules/crypto-js/core.js
var require_core = __commonJS({
  "node_modules/crypto-js/core.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define([], factory);
      } else {
        root.CryptoJS = factory();
      }
    })(exports, function() {
      var CryptoJS = CryptoJS || function(Math2, undefined2) {
        var crypto;
        if (typeof window !== "undefined" && window.crypto) {
          crypto = window.crypto;
        }
        if (typeof self !== "undefined" && self.crypto) {
          crypto = self.crypto;
        }
        if (typeof globalThis !== "undefined" && globalThis.crypto) {
          crypto = globalThis.crypto;
        }
        if (!crypto && typeof window !== "undefined" && window.msCrypto) {
          crypto = window.msCrypto;
        }
        if (!crypto && typeof global !== "undefined" && global.crypto) {
          crypto = global.crypto;
        }
        if (!crypto && typeof require === "function") {
          try {
            crypto = require("crypto");
          } catch (err) {
          }
        }
        var cryptoSecureRandomInt = function() {
          if (crypto) {
            if (typeof crypto.getRandomValues === "function") {
              try {
                return crypto.getRandomValues(new Uint32Array(1))[0];
              } catch (err) {
              }
            }
            if (typeof crypto.randomBytes === "function") {
              try {
                return crypto.randomBytes(4).readInt32LE();
              } catch (err) {
              }
            }
          }
          throw new Error("Native crypto module could not be used to get secure random number.");
        };
        var create = Object.create || function() {
          function F() {
          }
          return function(obj) {
            var subtype;
            F.prototype = obj;
            subtype = new F();
            F.prototype = null;
            return subtype;
          };
        }();
        var C = {};
        var C_lib = C.lib = {};
        var Base = C_lib.Base = function() {
          return {
            extend: function(overrides) {
              var subtype = create(this);
              if (overrides) {
                subtype.mixIn(overrides);
              }
              if (!subtype.hasOwnProperty("init") || this.init === subtype.init) {
                subtype.init = function() {
                  subtype.$super.init.apply(this, arguments);
                };
              }
              subtype.init.prototype = subtype;
              subtype.$super = this;
              return subtype;
            },
            create: function() {
              var instance = this.extend();
              instance.init.apply(instance, arguments);
              return instance;
            },
            init: function() {
            },
            mixIn: function(properties) {
              for (var propertyName in properties) {
                if (properties.hasOwnProperty(propertyName)) {
                  this[propertyName] = properties[propertyName];
                }
              }
              if (properties.hasOwnProperty("toString")) {
                this.toString = properties.toString;
              }
            },
            clone: function() {
              return this.init.prototype.extend(this);
            }
          };
        }();
        var WordArray = C_lib.WordArray = Base.extend({
          init: function(words, sigBytes) {
            words = this.words = words || [];
            if (sigBytes != undefined2) {
              this.sigBytes = sigBytes;
            } else {
              this.sigBytes = words.length * 4;
            }
          },
          toString: function(encoder) {
            return (encoder || Hex).stringify(this);
          },
          concat: function(wordArray) {
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;
            this.clamp();
            if (thisSigBytes % 4) {
              for (var i = 0; i < thatSigBytes; i++) {
                var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
              }
            } else {
              for (var j = 0; j < thatSigBytes; j += 4) {
                thisWords[thisSigBytes + j >>> 2] = thatWords[j >>> 2];
              }
            }
            this.sigBytes += thatSigBytes;
            return this;
          },
          clamp: function() {
            var words = this.words;
            var sigBytes = this.sigBytes;
            words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
            words.length = Math2.ceil(sigBytes / 4);
          },
          clone: function() {
            var clone2 = Base.clone.call(this);
            clone2.words = this.words.slice(0);
            return clone2;
          },
          random: function(nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
              words.push(cryptoSecureRandomInt());
            }
            return new WordArray.init(words, nBytes);
          }
        });
        var C_enc = C.enc = {};
        var Hex = C_enc.Hex = {
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
              var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              hexChars.push((bite >>> 4).toString(16));
              hexChars.push((bite & 15).toString(16));
            }
            return hexChars.join("");
          },
          parse: function(hexStr) {
            var hexStrLength = hexStr.length;
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
              words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
            }
            return new WordArray.init(words, hexStrLength / 2);
          }
        };
        var Latin1 = C_enc.Latin1 = {
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
              var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              latin1Chars.push(String.fromCharCode(bite));
            }
            return latin1Chars.join("");
          },
          parse: function(latin1Str) {
            var latin1StrLength = latin1Str.length;
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
              words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
            }
            return new WordArray.init(words, latin1StrLength);
          }
        };
        var Utf8 = C_enc.Utf8 = {
          stringify: function(wordArray) {
            try {
              return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
              throw new Error("Malformed UTF-8 data");
            }
          },
          parse: function(utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
          }
        };
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
          reset: function() {
            this._data = new WordArray.init();
            this._nDataBytes = 0;
          },
          _append: function(data) {
            if (typeof data == "string") {
              data = Utf8.parse(data);
            }
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
          },
          _process: function(doFlush) {
            var processedWords;
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
              nBlocksReady = Math2.ceil(nBlocksReady);
            } else {
              nBlocksReady = Math2.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }
            var nWordsReady = nBlocksReady * blockSize;
            var nBytesReady = Math2.min(nWordsReady * 4, dataSigBytes);
            if (nWordsReady) {
              for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                this._doProcessBlock(dataWords, offset);
              }
              processedWords = dataWords.splice(0, nWordsReady);
              data.sigBytes -= nBytesReady;
            }
            return new WordArray.init(processedWords, nBytesReady);
          },
          clone: function() {
            var clone2 = Base.clone.call(this);
            clone2._data = this._data.clone();
            return clone2;
          },
          _minBufferSize: 0
        });
        var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
          cfg: Base.extend(),
          init: function(cfg) {
            this.cfg = this.cfg.extend(cfg);
            this.reset();
          },
          reset: function() {
            BufferedBlockAlgorithm.reset.call(this);
            this._doReset();
          },
          update: function(messageUpdate) {
            this._append(messageUpdate);
            this._process();
            return this;
          },
          finalize: function(messageUpdate) {
            if (messageUpdate) {
              this._append(messageUpdate);
            }
            var hash2 = this._doFinalize();
            return hash2;
          },
          blockSize: 512 / 32,
          _createHelper: function(hasher) {
            return function(message, cfg) {
              return new hasher.init(cfg).finalize(message);
            };
          },
          _createHmacHelper: function(hasher) {
            return function(message, key) {
              return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
          }
        });
        var C_algo = C.algo = {};
        return C;
      }(Math);
      return CryptoJS;
    });
  }
});

// node_modules/crypto-js/x64-core.js
var require_x64_core = __commonJS({
  "node_modules/crypto-js/x64-core.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(undefined2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var X32WordArray = C_lib.WordArray;
        var C_x64 = C.x64 = {};
        var X64Word = C_x64.Word = Base.extend({
          init: function(high, low) {
            this.high = high;
            this.low = low;
          }
        });
        var X64WordArray = C_x64.WordArray = Base.extend({
          init: function(words, sigBytes) {
            words = this.words = words || [];
            if (sigBytes != undefined2) {
              this.sigBytes = sigBytes;
            } else {
              this.sigBytes = words.length * 8;
            }
          },
          toX32: function() {
            var x64Words = this.words;
            var x64WordsLength = x64Words.length;
            var x32Words = [];
            for (var i = 0; i < x64WordsLength; i++) {
              var x64Word = x64Words[i];
              x32Words.push(x64Word.high);
              x32Words.push(x64Word.low);
            }
            return X32WordArray.create(x32Words, this.sigBytes);
          },
          clone: function() {
            var clone2 = Base.clone.call(this);
            var words = clone2.words = this.words.slice(0);
            var wordsLength = words.length;
            for (var i = 0; i < wordsLength; i++) {
              words[i] = words[i].clone();
            }
            return clone2;
          }
        });
      })();
      return CryptoJS;
    });
  }
});

// node_modules/crypto-js/lib-typedarrays.js
var require_lib_typedarrays = __commonJS({
  "node_modules/crypto-js/lib-typedarrays.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        if (typeof ArrayBuffer != "function") {
          return;
        }
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var superInit = WordArray.init;
        var subInit = WordArray.init = function(typedArray) {
          if (typedArray instanceof ArrayBuffer) {
            typedArray = new Uint8Array(typedArray);
          }
          if (typedArray instanceof Int8Array || typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) {
            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
          }
          if (typedArray instanceof Uint8Array) {
            var typedArrayByteLength = typedArray.byteLength;
            var words = [];
            for (var i = 0; i < typedArrayByteLength; i++) {
              words[i >>> 2] |= typedArray[i] << 24 - i % 4 * 8;
            }
            superInit.call(this, words, typedArrayByteLength);
          } else {
            superInit.apply(this, arguments);
          }
        };
        subInit.prototype = WordArray;
      })();
      return CryptoJS.lib.WordArray;
    });
  }
});

// node_modules/crypto-js/enc-utf16.js
var require_enc_utf16 = __commonJS({
  "node_modules/crypto-js/enc-utf16.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;
        var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var utf16Chars = [];
            for (var i = 0; i < sigBytes; i += 2) {
              var codePoint = words[i >>> 2] >>> 16 - i % 4 * 8 & 65535;
              utf16Chars.push(String.fromCharCode(codePoint));
            }
            return utf16Chars.join("");
          },
          parse: function(utf16Str) {
            var utf16StrLength = utf16Str.length;
            var words = [];
            for (var i = 0; i < utf16StrLength; i++) {
              words[i >>> 1] |= utf16Str.charCodeAt(i) << 16 - i % 2 * 16;
            }
            return WordArray.create(words, utf16StrLength * 2);
          }
        };
        C_enc.Utf16LE = {
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var utf16Chars = [];
            for (var i = 0; i < sigBytes; i += 2) {
              var codePoint = swapEndian(words[i >>> 2] >>> 16 - i % 4 * 8 & 65535);
              utf16Chars.push(String.fromCharCode(codePoint));
            }
            return utf16Chars.join("");
          },
          parse: function(utf16Str) {
            var utf16StrLength = utf16Str.length;
            var words = [];
            for (var i = 0; i < utf16StrLength; i++) {
              words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << 16 - i % 2 * 16);
            }
            return WordArray.create(words, utf16StrLength * 2);
          }
        };
        function swapEndian(word) {
          return word << 8 & 4278255360 | word >>> 8 & 16711935;
        }
      })();
      return CryptoJS.enc.Utf16;
    });
  }
});

// node_modules/crypto-js/enc-base64.js
var require_enc_base64 = __commonJS({
  "node_modules/crypto-js/enc-base64.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;
        var Base64 = C_enc.Base64 = {
          stringify: function(wordArray) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var map = this._map;
            wordArray.clamp();
            var base64Chars = [];
            for (var i = 0; i < sigBytes; i += 3) {
              var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
              var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
              var triplet = byte1 << 16 | byte2 << 8 | byte3;
              for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
                base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              while (base64Chars.length % 4) {
                base64Chars.push(paddingChar);
              }
            }
            return base64Chars.join("");
          },
          parse: function(base64Str) {
            var base64StrLength = base64Str.length;
            var map = this._map;
            var reverseMap = this._reverseMap;
            if (!reverseMap) {
              reverseMap = this._reverseMap = [];
              for (var j = 0; j < map.length; j++) {
                reverseMap[map.charCodeAt(j)] = j;
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              var paddingIndex = base64Str.indexOf(paddingChar);
              if (paddingIndex !== -1) {
                base64StrLength = paddingIndex;
              }
            }
            return parseLoop(base64Str, base64StrLength, reverseMap);
          },
          _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        };
        function parseLoop(base64Str, base64StrLength, reverseMap) {
          var words = [];
          var nBytes = 0;
          for (var i = 0; i < base64StrLength; i++) {
            if (i % 4) {
              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2;
              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
              var bitsCombined = bits1 | bits2;
              words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
              nBytes++;
            }
          }
          return WordArray.create(words, nBytes);
        }
      })();
      return CryptoJS.enc.Base64;
    });
  }
});

// node_modules/crypto-js/enc-base64url.js
var require_enc_base64url = __commonJS({
  "node_modules/crypto-js/enc-base64url.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;
        var Base64url = C_enc.Base64url = {
          stringify: function(wordArray, urlSafe = true) {
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var map = urlSafe ? this._safe_map : this._map;
            wordArray.clamp();
            var base64Chars = [];
            for (var i = 0; i < sigBytes; i += 3) {
              var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
              var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
              var triplet = byte1 << 16 | byte2 << 8 | byte3;
              for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
                base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              while (base64Chars.length % 4) {
                base64Chars.push(paddingChar);
              }
            }
            return base64Chars.join("");
          },
          parse: function(base64Str, urlSafe = true) {
            var base64StrLength = base64Str.length;
            var map = urlSafe ? this._safe_map : this._map;
            var reverseMap = this._reverseMap;
            if (!reverseMap) {
              reverseMap = this._reverseMap = [];
              for (var j = 0; j < map.length; j++) {
                reverseMap[map.charCodeAt(j)] = j;
              }
            }
            var paddingChar = map.charAt(64);
            if (paddingChar) {
              var paddingIndex = base64Str.indexOf(paddingChar);
              if (paddingIndex !== -1) {
                base64StrLength = paddingIndex;
              }
            }
            return parseLoop(base64Str, base64StrLength, reverseMap);
          },
          _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
          _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        };
        function parseLoop(base64Str, base64StrLength, reverseMap) {
          var words = [];
          var nBytes = 0;
          for (var i = 0; i < base64StrLength; i++) {
            if (i % 4) {
              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2;
              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
              var bitsCombined = bits1 | bits2;
              words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
              nBytes++;
            }
          }
          return WordArray.create(words, nBytes);
        }
      })();
      return CryptoJS.enc.Base64url;
    });
  }
});

// node_modules/crypto-js/md5.js
var require_md5 = __commonJS({
  "node_modules/crypto-js/md5.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(Math2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var T = [];
        (function() {
          for (var i = 0; i < 64; i++) {
            T[i] = Math2.abs(Math2.sin(i + 1)) * 4294967296 | 0;
          }
        })();
        var MD5 = C_algo.MD5 = Hasher.extend({
          _doReset: function() {
            this._hash = new WordArray.init([
              1732584193,
              4023233417,
              2562383102,
              271733878
            ]);
          },
          _doProcessBlock: function(M, offset) {
            for (var i = 0; i < 16; i++) {
              var offset_i = offset + i;
              var M_offset_i = M[offset_i];
              M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
            }
            var H = this._hash.words;
            var M_offset_0 = M[offset + 0];
            var M_offset_1 = M[offset + 1];
            var M_offset_2 = M[offset + 2];
            var M_offset_3 = M[offset + 3];
            var M_offset_4 = M[offset + 4];
            var M_offset_5 = M[offset + 5];
            var M_offset_6 = M[offset + 6];
            var M_offset_7 = M[offset + 7];
            var M_offset_8 = M[offset + 8];
            var M_offset_9 = M[offset + 9];
            var M_offset_10 = M[offset + 10];
            var M_offset_11 = M[offset + 11];
            var M_offset_12 = M[offset + 12];
            var M_offset_13 = M[offset + 13];
            var M_offset_14 = M[offset + 14];
            var M_offset_15 = M[offset + 15];
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d2 = H[3];
            a = FF(a, b, c, d2, M_offset_0, 7, T[0]);
            d2 = FF(d2, a, b, c, M_offset_1, 12, T[1]);
            c = FF(c, d2, a, b, M_offset_2, 17, T[2]);
            b = FF(b, c, d2, a, M_offset_3, 22, T[3]);
            a = FF(a, b, c, d2, M_offset_4, 7, T[4]);
            d2 = FF(d2, a, b, c, M_offset_5, 12, T[5]);
            c = FF(c, d2, a, b, M_offset_6, 17, T[6]);
            b = FF(b, c, d2, a, M_offset_7, 22, T[7]);
            a = FF(a, b, c, d2, M_offset_8, 7, T[8]);
            d2 = FF(d2, a, b, c, M_offset_9, 12, T[9]);
            c = FF(c, d2, a, b, M_offset_10, 17, T[10]);
            b = FF(b, c, d2, a, M_offset_11, 22, T[11]);
            a = FF(a, b, c, d2, M_offset_12, 7, T[12]);
            d2 = FF(d2, a, b, c, M_offset_13, 12, T[13]);
            c = FF(c, d2, a, b, M_offset_14, 17, T[14]);
            b = FF(b, c, d2, a, M_offset_15, 22, T[15]);
            a = GG(a, b, c, d2, M_offset_1, 5, T[16]);
            d2 = GG(d2, a, b, c, M_offset_6, 9, T[17]);
            c = GG(c, d2, a, b, M_offset_11, 14, T[18]);
            b = GG(b, c, d2, a, M_offset_0, 20, T[19]);
            a = GG(a, b, c, d2, M_offset_5, 5, T[20]);
            d2 = GG(d2, a, b, c, M_offset_10, 9, T[21]);
            c = GG(c, d2, a, b, M_offset_15, 14, T[22]);
            b = GG(b, c, d2, a, M_offset_4, 20, T[23]);
            a = GG(a, b, c, d2, M_offset_9, 5, T[24]);
            d2 = GG(d2, a, b, c, M_offset_14, 9, T[25]);
            c = GG(c, d2, a, b, M_offset_3, 14, T[26]);
            b = GG(b, c, d2, a, M_offset_8, 20, T[27]);
            a = GG(a, b, c, d2, M_offset_13, 5, T[28]);
            d2 = GG(d2, a, b, c, M_offset_2, 9, T[29]);
            c = GG(c, d2, a, b, M_offset_7, 14, T[30]);
            b = GG(b, c, d2, a, M_offset_12, 20, T[31]);
            a = HH(a, b, c, d2, M_offset_5, 4, T[32]);
            d2 = HH(d2, a, b, c, M_offset_8, 11, T[33]);
            c = HH(c, d2, a, b, M_offset_11, 16, T[34]);
            b = HH(b, c, d2, a, M_offset_14, 23, T[35]);
            a = HH(a, b, c, d2, M_offset_1, 4, T[36]);
            d2 = HH(d2, a, b, c, M_offset_4, 11, T[37]);
            c = HH(c, d2, a, b, M_offset_7, 16, T[38]);
            b = HH(b, c, d2, a, M_offset_10, 23, T[39]);
            a = HH(a, b, c, d2, M_offset_13, 4, T[40]);
            d2 = HH(d2, a, b, c, M_offset_0, 11, T[41]);
            c = HH(c, d2, a, b, M_offset_3, 16, T[42]);
            b = HH(b, c, d2, a, M_offset_6, 23, T[43]);
            a = HH(a, b, c, d2, M_offset_9, 4, T[44]);
            d2 = HH(d2, a, b, c, M_offset_12, 11, T[45]);
            c = HH(c, d2, a, b, M_offset_15, 16, T[46]);
            b = HH(b, c, d2, a, M_offset_2, 23, T[47]);
            a = II(a, b, c, d2, M_offset_0, 6, T[48]);
            d2 = II(d2, a, b, c, M_offset_7, 10, T[49]);
            c = II(c, d2, a, b, M_offset_14, 15, T[50]);
            b = II(b, c, d2, a, M_offset_5, 21, T[51]);
            a = II(a, b, c, d2, M_offset_12, 6, T[52]);
            d2 = II(d2, a, b, c, M_offset_3, 10, T[53]);
            c = II(c, d2, a, b, M_offset_10, 15, T[54]);
            b = II(b, c, d2, a, M_offset_1, 21, T[55]);
            a = II(a, b, c, d2, M_offset_8, 6, T[56]);
            d2 = II(d2, a, b, c, M_offset_15, 10, T[57]);
            c = II(c, d2, a, b, M_offset_6, 15, T[58]);
            b = II(b, c, d2, a, M_offset_13, 21, T[59]);
            a = II(a, b, c, d2, M_offset_4, 6, T[60]);
            d2 = II(d2, a, b, c, M_offset_11, 10, T[61]);
            c = II(c, d2, a, b, M_offset_2, 15, T[62]);
            b = II(b, c, d2, a, M_offset_9, 21, T[63]);
            H[0] = H[0] + a | 0;
            H[1] = H[1] + b | 0;
            H[2] = H[2] + c | 0;
            H[3] = H[3] + d2 | 0;
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            var nBitsTotalH = Math2.floor(nBitsTotal / 4294967296);
            var nBitsTotalL = nBitsTotal;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = (nBitsTotalH << 8 | nBitsTotalH >>> 24) & 16711935 | (nBitsTotalH << 24 | nBitsTotalH >>> 8) & 4278255360;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotalL << 8 | nBitsTotalL >>> 24) & 16711935 | (nBitsTotalL << 24 | nBitsTotalL >>> 8) & 4278255360;
            data.sigBytes = (dataWords.length + 1) * 4;
            this._process();
            var hash2 = this._hash;
            var H = hash2.words;
            for (var i = 0; i < 4; i++) {
              var H_i = H[i];
              H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
            }
            return hash2;
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            clone2._hash = this._hash.clone();
            return clone2;
          }
        });
        function FF(a, b, c, d2, x, s2, t) {
          var n = a + (b & c | ~b & d2) + x + t;
          return (n << s2 | n >>> 32 - s2) + b;
        }
        function GG(a, b, c, d2, x, s2, t) {
          var n = a + (b & d2 | c & ~d2) + x + t;
          return (n << s2 | n >>> 32 - s2) + b;
        }
        function HH(a, b, c, d2, x, s2, t) {
          var n = a + (b ^ c ^ d2) + x + t;
          return (n << s2 | n >>> 32 - s2) + b;
        }
        function II(a, b, c, d2, x, s2, t) {
          var n = a + (c ^ (b | ~d2)) + x + t;
          return (n << s2 | n >>> 32 - s2) + b;
        }
        C.MD5 = Hasher._createHelper(MD5);
        C.HmacMD5 = Hasher._createHmacHelper(MD5);
      })(Math);
      return CryptoJS.MD5;
    });
  }
});

// node_modules/crypto-js/sha1.js
var require_sha1 = __commonJS({
  "node_modules/crypto-js/sha1.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var W = [];
        var SHA1 = C_algo.SHA1 = Hasher.extend({
          _doReset: function() {
            this._hash = new WordArray.init([
              1732584193,
              4023233417,
              2562383102,
              271733878,
              3285377520
            ]);
          },
          _doProcessBlock: function(M, offset) {
            var H = this._hash.words;
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d2 = H[3];
            var e = H[4];
            for (var i = 0; i < 80; i++) {
              if (i < 16) {
                W[i] = M[offset + i] | 0;
              } else {
                var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                W[i] = n << 1 | n >>> 31;
              }
              var t = (a << 5 | a >>> 27) + e + W[i];
              if (i < 20) {
                t += (b & c | ~b & d2) + 1518500249;
              } else if (i < 40) {
                t += (b ^ c ^ d2) + 1859775393;
              } else if (i < 60) {
                t += (b & c | b & d2 | c & d2) - 1894007588;
              } else {
                t += (b ^ c ^ d2) - 899497514;
              }
              e = d2;
              d2 = c;
              c = b << 30 | b >>> 2;
              b = a;
              a = t;
            }
            H[0] = H[0] + a | 0;
            H[1] = H[1] + b | 0;
            H[2] = H[2] + c | 0;
            H[3] = H[3] + d2 | 0;
            H[4] = H[4] + e | 0;
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;
            this._process();
            return this._hash;
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            clone2._hash = this._hash.clone();
            return clone2;
          }
        });
        C.SHA1 = Hasher._createHelper(SHA1);
        C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
      })();
      return CryptoJS.SHA1;
    });
  }
});

// node_modules/crypto-js/sha256.js
var require_sha256 = __commonJS({
  "node_modules/crypto-js/sha256.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(Math2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var H = [];
        var K = [];
        (function() {
          function isPrime(n2) {
            var sqrtN = Math2.sqrt(n2);
            for (var factor = 2; factor <= sqrtN; factor++) {
              if (!(n2 % factor)) {
                return false;
              }
            }
            return true;
          }
          function getFractionalBits(n2) {
            return (n2 - (n2 | 0)) * 4294967296 | 0;
          }
          var n = 2;
          var nPrime = 0;
          while (nPrime < 64) {
            if (isPrime(n)) {
              if (nPrime < 8) {
                H[nPrime] = getFractionalBits(Math2.pow(n, 1 / 2));
              }
              K[nPrime] = getFractionalBits(Math2.pow(n, 1 / 3));
              nPrime++;
            }
            n++;
          }
        })();
        var W = [];
        var SHA256 = C_algo.SHA256 = Hasher.extend({
          _doReset: function() {
            this._hash = new WordArray.init(H.slice(0));
          },
          _doProcessBlock: function(M, offset) {
            var H2 = this._hash.words;
            var a = H2[0];
            var b = H2[1];
            var c = H2[2];
            var d2 = H2[3];
            var e = H2[4];
            var f = H2[5];
            var g = H2[6];
            var h = H2[7];
            for (var i = 0; i < 64; i++) {
              if (i < 16) {
                W[i] = M[offset + i] | 0;
              } else {
                var gamma0x = W[i - 15];
                var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
                var gamma1x = W[i - 2];
                var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
                W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
              }
              var ch = e & f ^ ~e & g;
              var maj = a & b ^ a & c ^ b & c;
              var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
              var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
              var t1 = h + sigma1 + ch + K[i] + W[i];
              var t2 = sigma0 + maj;
              h = g;
              g = f;
              f = e;
              e = d2 + t1 | 0;
              d2 = c;
              c = b;
              b = a;
              a = t1 + t2 | 0;
            }
            H2[0] = H2[0] + a | 0;
            H2[1] = H2[1] + b | 0;
            H2[2] = H2[2] + c | 0;
            H2[3] = H2[3] + d2 | 0;
            H2[4] = H2[4] + e | 0;
            H2[5] = H2[5] + f | 0;
            H2[6] = H2[6] + g | 0;
            H2[7] = H2[7] + h | 0;
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math2.floor(nBitsTotal / 4294967296);
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;
            this._process();
            return this._hash;
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            clone2._hash = this._hash.clone();
            return clone2;
          }
        });
        C.SHA256 = Hasher._createHelper(SHA256);
        C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
      })(Math);
      return CryptoJS.SHA256;
    });
  }
});

// node_modules/crypto-js/sha224.js
var require_sha224 = __commonJS({
  "node_modules/crypto-js/sha224.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_sha256());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./sha256"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_algo = C.algo;
        var SHA256 = C_algo.SHA256;
        var SHA224 = C_algo.SHA224 = SHA256.extend({
          _doReset: function() {
            this._hash = new WordArray.init([
              3238371032,
              914150663,
              812702999,
              4144912697,
              4290775857,
              1750603025,
              1694076839,
              3204075428
            ]);
          },
          _doFinalize: function() {
            var hash2 = SHA256._doFinalize.call(this);
            hash2.sigBytes -= 4;
            return hash2;
          }
        });
        C.SHA224 = SHA256._createHelper(SHA224);
        C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
      })();
      return CryptoJS.SHA224;
    });
  }
});

// node_modules/crypto-js/sha512.js
var require_sha512 = __commonJS({
  "node_modules/crypto-js/sha512.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_x64_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./x64-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Hasher = C_lib.Hasher;
        var C_x64 = C.x64;
        var X64Word = C_x64.Word;
        var X64WordArray = C_x64.WordArray;
        var C_algo = C.algo;
        function X64Word_create() {
          return X64Word.create.apply(X64Word, arguments);
        }
        var K = [
          X64Word_create(1116352408, 3609767458),
          X64Word_create(1899447441, 602891725),
          X64Word_create(3049323471, 3964484399),
          X64Word_create(3921009573, 2173295548),
          X64Word_create(961987163, 4081628472),
          X64Word_create(1508970993, 3053834265),
          X64Word_create(2453635748, 2937671579),
          X64Word_create(2870763221, 3664609560),
          X64Word_create(3624381080, 2734883394),
          X64Word_create(310598401, 1164996542),
          X64Word_create(607225278, 1323610764),
          X64Word_create(1426881987, 3590304994),
          X64Word_create(1925078388, 4068182383),
          X64Word_create(2162078206, 991336113),
          X64Word_create(2614888103, 633803317),
          X64Word_create(3248222580, 3479774868),
          X64Word_create(3835390401, 2666613458),
          X64Word_create(4022224774, 944711139),
          X64Word_create(264347078, 2341262773),
          X64Word_create(604807628, 2007800933),
          X64Word_create(770255983, 1495990901),
          X64Word_create(1249150122, 1856431235),
          X64Word_create(1555081692, 3175218132),
          X64Word_create(1996064986, 2198950837),
          X64Word_create(2554220882, 3999719339),
          X64Word_create(2821834349, 766784016),
          X64Word_create(2952996808, 2566594879),
          X64Word_create(3210313671, 3203337956),
          X64Word_create(3336571891, 1034457026),
          X64Word_create(3584528711, 2466948901),
          X64Word_create(113926993, 3758326383),
          X64Word_create(338241895, 168717936),
          X64Word_create(666307205, 1188179964),
          X64Word_create(773529912, 1546045734),
          X64Word_create(1294757372, 1522805485),
          X64Word_create(1396182291, 2643833823),
          X64Word_create(1695183700, 2343527390),
          X64Word_create(1986661051, 1014477480),
          X64Word_create(2177026350, 1206759142),
          X64Word_create(2456956037, 344077627),
          X64Word_create(2730485921, 1290863460),
          X64Word_create(2820302411, 3158454273),
          X64Word_create(3259730800, 3505952657),
          X64Word_create(3345764771, 106217008),
          X64Word_create(3516065817, 3606008344),
          X64Word_create(3600352804, 1432725776),
          X64Word_create(4094571909, 1467031594),
          X64Word_create(275423344, 851169720),
          X64Word_create(430227734, 3100823752),
          X64Word_create(506948616, 1363258195),
          X64Word_create(659060556, 3750685593),
          X64Word_create(883997877, 3785050280),
          X64Word_create(958139571, 3318307427),
          X64Word_create(1322822218, 3812723403),
          X64Word_create(1537002063, 2003034995),
          X64Word_create(1747873779, 3602036899),
          X64Word_create(1955562222, 1575990012),
          X64Word_create(2024104815, 1125592928),
          X64Word_create(2227730452, 2716904306),
          X64Word_create(2361852424, 442776044),
          X64Word_create(2428436474, 593698344),
          X64Word_create(2756734187, 3733110249),
          X64Word_create(3204031479, 2999351573),
          X64Word_create(3329325298, 3815920427),
          X64Word_create(3391569614, 3928383900),
          X64Word_create(3515267271, 566280711),
          X64Word_create(3940187606, 3454069534),
          X64Word_create(4118630271, 4000239992),
          X64Word_create(116418474, 1914138554),
          X64Word_create(174292421, 2731055270),
          X64Word_create(289380356, 3203993006),
          X64Word_create(460393269, 320620315),
          X64Word_create(685471733, 587496836),
          X64Word_create(852142971, 1086792851),
          X64Word_create(1017036298, 365543100),
          X64Word_create(1126000580, 2618297676),
          X64Word_create(1288033470, 3409855158),
          X64Word_create(1501505948, 4234509866),
          X64Word_create(1607167915, 987167468),
          X64Word_create(1816402316, 1246189591)
        ];
        var W = [];
        (function() {
          for (var i = 0; i < 80; i++) {
            W[i] = X64Word_create();
          }
        })();
        var SHA512 = C_algo.SHA512 = Hasher.extend({
          _doReset: function() {
            this._hash = new X64WordArray.init([
              new X64Word.init(1779033703, 4089235720),
              new X64Word.init(3144134277, 2227873595),
              new X64Word.init(1013904242, 4271175723),
              new X64Word.init(2773480762, 1595750129),
              new X64Word.init(1359893119, 2917565137),
              new X64Word.init(2600822924, 725511199),
              new X64Word.init(528734635, 4215389547),
              new X64Word.init(1541459225, 327033209)
            ]);
          },
          _doProcessBlock: function(M, offset) {
            var H = this._hash.words;
            var H0 = H[0];
            var H1 = H[1];
            var H2 = H[2];
            var H3 = H[3];
            var H4 = H[4];
            var H5 = H[5];
            var H6 = H[6];
            var H7 = H[7];
            var H0h = H0.high;
            var H0l = H0.low;
            var H1h = H1.high;
            var H1l = H1.low;
            var H2h = H2.high;
            var H2l = H2.low;
            var H3h = H3.high;
            var H3l = H3.low;
            var H4h = H4.high;
            var H4l = H4.low;
            var H5h = H5.high;
            var H5l = H5.low;
            var H6h = H6.high;
            var H6l = H6.low;
            var H7h = H7.high;
            var H7l = H7.low;
            var ah = H0h;
            var al = H0l;
            var bh = H1h;
            var bl = H1l;
            var ch = H2h;
            var cl = H2l;
            var dh = H3h;
            var dl = H3l;
            var eh = H4h;
            var el = H4l;
            var fh = H5h;
            var fl = H5l;
            var gh = H6h;
            var gl = H6l;
            var hh = H7h;
            var hl = H7l;
            for (var i = 0; i < 80; i++) {
              var Wil;
              var Wih;
              var Wi = W[i];
              if (i < 16) {
                Wih = Wi.high = M[offset + i * 2] | 0;
                Wil = Wi.low = M[offset + i * 2 + 1] | 0;
              } else {
                var gamma0x = W[i - 15];
                var gamma0xh = gamma0x.high;
                var gamma0xl = gamma0x.low;
                var gamma0h = (gamma0xh >>> 1 | gamma0xl << 31) ^ (gamma0xh >>> 8 | gamma0xl << 24) ^ gamma0xh >>> 7;
                var gamma0l = (gamma0xl >>> 1 | gamma0xh << 31) ^ (gamma0xl >>> 8 | gamma0xh << 24) ^ (gamma0xl >>> 7 | gamma0xh << 25);
                var gamma1x = W[i - 2];
                var gamma1xh = gamma1x.high;
                var gamma1xl = gamma1x.low;
                var gamma1h = (gamma1xh >>> 19 | gamma1xl << 13) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
                var gamma1l = (gamma1xl >>> 19 | gamma1xh << 13) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xl >>> 6 | gamma1xh << 26);
                var Wi7 = W[i - 7];
                var Wi7h = Wi7.high;
                var Wi7l = Wi7.low;
                var Wi16 = W[i - 16];
                var Wi16h = Wi16.high;
                var Wi16l = Wi16.low;
                Wil = gamma0l + Wi7l;
                Wih = gamma0h + Wi7h + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
                Wil = Wil + gamma1l;
                Wih = Wih + gamma1h + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
                Wil = Wil + Wi16l;
                Wih = Wih + Wi16h + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);
                Wi.high = Wih;
                Wi.low = Wil;
              }
              var chh = eh & fh ^ ~eh & gh;
              var chl = el & fl ^ ~el & gl;
              var majh = ah & bh ^ ah & ch ^ bh & ch;
              var majl = al & bl ^ al & cl ^ bl & cl;
              var sigma0h = (ah >>> 28 | al << 4) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
              var sigma0l = (al >>> 28 | ah << 4) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
              var sigma1h = (eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9);
              var sigma1l = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9);
              var Ki = K[i];
              var Kih = Ki.high;
              var Kil = Ki.low;
              var t1l = hl + sigma1l;
              var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
              var t1l = t1l + chl;
              var t1h = t1h + chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
              var t1l = t1l + Kil;
              var t1h = t1h + Kih + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
              var t1l = t1l + Wil;
              var t1h = t1h + Wih + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);
              var t2l = sigma0l + majl;
              var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
              hh = gh;
              hl = gl;
              gh = fh;
              gl = fl;
              fh = eh;
              fl = el;
              el = dl + t1l | 0;
              eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
              dh = ch;
              dl = cl;
              ch = bh;
              cl = bl;
              bh = ah;
              bl = al;
              al = t1l + t2l | 0;
              ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
            }
            H0l = H0.low = H0l + al;
            H0.high = H0h + ah + (H0l >>> 0 < al >>> 0 ? 1 : 0);
            H1l = H1.low = H1l + bl;
            H1.high = H1h + bh + (H1l >>> 0 < bl >>> 0 ? 1 : 0);
            H2l = H2.low = H2l + cl;
            H2.high = H2h + ch + (H2l >>> 0 < cl >>> 0 ? 1 : 0);
            H3l = H3.low = H3l + dl;
            H3.high = H3h + dh + (H3l >>> 0 < dl >>> 0 ? 1 : 0);
            H4l = H4.low = H4l + el;
            H4.high = H4h + eh + (H4l >>> 0 < el >>> 0 ? 1 : 0);
            H5l = H5.low = H5l + fl;
            H5.high = H5h + fh + (H5l >>> 0 < fl >>> 0 ? 1 : 0);
            H6l = H6.low = H6l + gl;
            H6.high = H6h + gh + (H6l >>> 0 < gl >>> 0 ? 1 : 0);
            H7l = H7.low = H7l + hl;
            H7.high = H7h + hh + (H7l >>> 0 < hl >>> 0 ? 1 : 0);
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 128 >>> 10 << 5) + 30] = Math.floor(nBitsTotal / 4294967296);
            dataWords[(nBitsLeft + 128 >>> 10 << 5) + 31] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;
            this._process();
            var hash2 = this._hash.toX32();
            return hash2;
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            clone2._hash = this._hash.clone();
            return clone2;
          },
          blockSize: 1024 / 32
        });
        C.SHA512 = Hasher._createHelper(SHA512);
        C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
      })();
      return CryptoJS.SHA512;
    });
  }
});

// node_modules/crypto-js/sha384.js
var require_sha384 = __commonJS({
  "node_modules/crypto-js/sha384.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_x64_core(), require_sha512());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./x64-core", "./sha512"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_x64 = C.x64;
        var X64Word = C_x64.Word;
        var X64WordArray = C_x64.WordArray;
        var C_algo = C.algo;
        var SHA512 = C_algo.SHA512;
        var SHA384 = C_algo.SHA384 = SHA512.extend({
          _doReset: function() {
            this._hash = new X64WordArray.init([
              new X64Word.init(3418070365, 3238371032),
              new X64Word.init(1654270250, 914150663),
              new X64Word.init(2438529370, 812702999),
              new X64Word.init(355462360, 4144912697),
              new X64Word.init(1731405415, 4290775857),
              new X64Word.init(2394180231, 1750603025),
              new X64Word.init(3675008525, 1694076839),
              new X64Word.init(1203062813, 3204075428)
            ]);
          },
          _doFinalize: function() {
            var hash2 = SHA512._doFinalize.call(this);
            hash2.sigBytes -= 16;
            return hash2;
          }
        });
        C.SHA384 = SHA512._createHelper(SHA384);
        C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
      })();
      return CryptoJS.SHA384;
    });
  }
});

// node_modules/crypto-js/sha3.js
var require_sha3 = __commonJS({
  "node_modules/crypto-js/sha3.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_x64_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./x64-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(Math2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_x64 = C.x64;
        var X64Word = C_x64.Word;
        var C_algo = C.algo;
        var RHO_OFFSETS = [];
        var PI_INDEXES = [];
        var ROUND_CONSTANTS = [];
        (function() {
          var x = 1, y = 0;
          for (var t = 0; t < 24; t++) {
            RHO_OFFSETS[x + 5 * y] = (t + 1) * (t + 2) / 2 % 64;
            var newX = y % 5;
            var newY = (2 * x + 3 * y) % 5;
            x = newX;
            y = newY;
          }
          for (var x = 0; x < 5; x++) {
            for (var y = 0; y < 5; y++) {
              PI_INDEXES[x + 5 * y] = y + (2 * x + 3 * y) % 5 * 5;
            }
          }
          var LFSR = 1;
          for (var i = 0; i < 24; i++) {
            var roundConstantMsw = 0;
            var roundConstantLsw = 0;
            for (var j = 0; j < 7; j++) {
              if (LFSR & 1) {
                var bitPosition = (1 << j) - 1;
                if (bitPosition < 32) {
                  roundConstantLsw ^= 1 << bitPosition;
                } else {
                  roundConstantMsw ^= 1 << bitPosition - 32;
                }
              }
              if (LFSR & 128) {
                LFSR = LFSR << 1 ^ 113;
              } else {
                LFSR <<= 1;
              }
            }
            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
          }
        })();
        var T = [];
        (function() {
          for (var i = 0; i < 25; i++) {
            T[i] = X64Word.create();
          }
        })();
        var SHA3 = C_algo.SHA3 = Hasher.extend({
          cfg: Hasher.cfg.extend({
            outputLength: 512
          }),
          _doReset: function() {
            var state = this._state = [];
            for (var i = 0; i < 25; i++) {
              state[i] = new X64Word.init();
            }
            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
          },
          _doProcessBlock: function(M, offset) {
            var state = this._state;
            var nBlockSizeLanes = this.blockSize / 2;
            for (var i = 0; i < nBlockSizeLanes; i++) {
              var M2i = M[offset + 2 * i];
              var M2i1 = M[offset + 2 * i + 1];
              M2i = (M2i << 8 | M2i >>> 24) & 16711935 | (M2i << 24 | M2i >>> 8) & 4278255360;
              M2i1 = (M2i1 << 8 | M2i1 >>> 24) & 16711935 | (M2i1 << 24 | M2i1 >>> 8) & 4278255360;
              var lane = state[i];
              lane.high ^= M2i1;
              lane.low ^= M2i;
            }
            for (var round = 0; round < 24; round++) {
              for (var x = 0; x < 5; x++) {
                var tMsw = 0, tLsw = 0;
                for (var y = 0; y < 5; y++) {
                  var lane = state[x + 5 * y];
                  tMsw ^= lane.high;
                  tLsw ^= lane.low;
                }
                var Tx = T[x];
                Tx.high = tMsw;
                Tx.low = tLsw;
              }
              for (var x = 0; x < 5; x++) {
                var Tx4 = T[(x + 4) % 5];
                var Tx1 = T[(x + 1) % 5];
                var Tx1Msw = Tx1.high;
                var Tx1Lsw = Tx1.low;
                var tMsw = Tx4.high ^ (Tx1Msw << 1 | Tx1Lsw >>> 31);
                var tLsw = Tx4.low ^ (Tx1Lsw << 1 | Tx1Msw >>> 31);
                for (var y = 0; y < 5; y++) {
                  var lane = state[x + 5 * y];
                  lane.high ^= tMsw;
                  lane.low ^= tLsw;
                }
              }
              for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                var tMsw;
                var tLsw;
                var lane = state[laneIndex];
                var laneMsw = lane.high;
                var laneLsw = lane.low;
                var rhoOffset = RHO_OFFSETS[laneIndex];
                if (rhoOffset < 32) {
                  tMsw = laneMsw << rhoOffset | laneLsw >>> 32 - rhoOffset;
                  tLsw = laneLsw << rhoOffset | laneMsw >>> 32 - rhoOffset;
                } else {
                  tMsw = laneLsw << rhoOffset - 32 | laneMsw >>> 64 - rhoOffset;
                  tLsw = laneMsw << rhoOffset - 32 | laneLsw >>> 64 - rhoOffset;
                }
                var TPiLane = T[PI_INDEXES[laneIndex]];
                TPiLane.high = tMsw;
                TPiLane.low = tLsw;
              }
              var T0 = T[0];
              var state0 = state[0];
              T0.high = state0.high;
              T0.low = state0.low;
              for (var x = 0; x < 5; x++) {
                for (var y = 0; y < 5; y++) {
                  var laneIndex = x + 5 * y;
                  var lane = state[laneIndex];
                  var TLane = T[laneIndex];
                  var Tx1Lane = T[(x + 1) % 5 + 5 * y];
                  var Tx2Lane = T[(x + 2) % 5 + 5 * y];
                  lane.high = TLane.high ^ ~Tx1Lane.high & Tx2Lane.high;
                  lane.low = TLane.low ^ ~Tx1Lane.low & Tx2Lane.low;
                }
              }
              var lane = state[0];
              var roundConstant = ROUND_CONSTANTS[round];
              lane.high ^= roundConstant.high;
              lane.low ^= roundConstant.low;
            }
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            var blockSizeBits = this.blockSize * 32;
            dataWords[nBitsLeft >>> 5] |= 1 << 24 - nBitsLeft % 32;
            dataWords[(Math2.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits >>> 5) - 1] |= 128;
            data.sigBytes = dataWords.length * 4;
            this._process();
            var state = this._state;
            var outputLengthBytes = this.cfg.outputLength / 8;
            var outputLengthLanes = outputLengthBytes / 8;
            var hashWords = [];
            for (var i = 0; i < outputLengthLanes; i++) {
              var lane = state[i];
              var laneMsw = lane.high;
              var laneLsw = lane.low;
              laneMsw = (laneMsw << 8 | laneMsw >>> 24) & 16711935 | (laneMsw << 24 | laneMsw >>> 8) & 4278255360;
              laneLsw = (laneLsw << 8 | laneLsw >>> 24) & 16711935 | (laneLsw << 24 | laneLsw >>> 8) & 4278255360;
              hashWords.push(laneLsw);
              hashWords.push(laneMsw);
            }
            return new WordArray.init(hashWords, outputLengthBytes);
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            var state = clone2._state = this._state.slice(0);
            for (var i = 0; i < 25; i++) {
              state[i] = state[i].clone();
            }
            return clone2;
          }
        });
        C.SHA3 = Hasher._createHelper(SHA3);
        C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
      })(Math);
      return CryptoJS.SHA3;
    });
  }
});

// node_modules/crypto-js/ripemd160.js
var require_ripemd160 = __commonJS({
  "node_modules/crypto-js/ripemd160.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(Math2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;
        var _zl = WordArray.create([
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          7,
          4,
          13,
          1,
          10,
          6,
          15,
          3,
          12,
          0,
          9,
          5,
          2,
          14,
          11,
          8,
          3,
          10,
          14,
          4,
          9,
          15,
          8,
          1,
          2,
          7,
          0,
          6,
          13,
          11,
          5,
          12,
          1,
          9,
          11,
          10,
          0,
          8,
          12,
          4,
          13,
          3,
          7,
          15,
          14,
          5,
          6,
          2,
          4,
          0,
          5,
          9,
          7,
          12,
          2,
          10,
          14,
          1,
          3,
          8,
          11,
          6,
          15,
          13
        ]);
        var _zr = WordArray.create([
          5,
          14,
          7,
          0,
          9,
          2,
          11,
          4,
          13,
          6,
          15,
          8,
          1,
          10,
          3,
          12,
          6,
          11,
          3,
          7,
          0,
          13,
          5,
          10,
          14,
          15,
          8,
          12,
          4,
          9,
          1,
          2,
          15,
          5,
          1,
          3,
          7,
          14,
          6,
          9,
          11,
          8,
          12,
          2,
          10,
          0,
          4,
          13,
          8,
          6,
          4,
          1,
          3,
          11,
          15,
          0,
          5,
          12,
          2,
          13,
          9,
          7,
          10,
          14,
          12,
          15,
          10,
          4,
          1,
          5,
          8,
          7,
          6,
          2,
          13,
          14,
          0,
          3,
          9,
          11
        ]);
        var _sl = WordArray.create([
          11,
          14,
          15,
          12,
          5,
          8,
          7,
          9,
          11,
          13,
          14,
          15,
          6,
          7,
          9,
          8,
          7,
          6,
          8,
          13,
          11,
          9,
          7,
          15,
          7,
          12,
          15,
          9,
          11,
          7,
          13,
          12,
          11,
          13,
          6,
          7,
          14,
          9,
          13,
          15,
          14,
          8,
          13,
          6,
          5,
          12,
          7,
          5,
          11,
          12,
          14,
          15,
          14,
          15,
          9,
          8,
          9,
          14,
          5,
          6,
          8,
          6,
          5,
          12,
          9,
          15,
          5,
          11,
          6,
          8,
          13,
          12,
          5,
          12,
          13,
          14,
          11,
          8,
          5,
          6
        ]);
        var _sr = WordArray.create([
          8,
          9,
          9,
          11,
          13,
          15,
          15,
          5,
          7,
          7,
          8,
          11,
          14,
          14,
          12,
          6,
          9,
          13,
          15,
          7,
          12,
          8,
          9,
          11,
          7,
          7,
          12,
          7,
          6,
          15,
          13,
          11,
          9,
          7,
          15,
          11,
          8,
          6,
          6,
          14,
          12,
          13,
          5,
          14,
          13,
          13,
          7,
          5,
          15,
          5,
          8,
          11,
          14,
          14,
          6,
          14,
          6,
          9,
          12,
          9,
          12,
          5,
          15,
          8,
          8,
          5,
          12,
          9,
          12,
          5,
          14,
          6,
          8,
          13,
          6,
          5,
          15,
          13,
          11,
          11
        ]);
        var _hl = WordArray.create([0, 1518500249, 1859775393, 2400959708, 2840853838]);
        var _hr = WordArray.create([1352829926, 1548603684, 1836072691, 2053994217, 0]);
        var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
          _doReset: function() {
            this._hash = WordArray.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
          },
          _doProcessBlock: function(M, offset) {
            for (var i = 0; i < 16; i++) {
              var offset_i = offset + i;
              var M_offset_i = M[offset_i];
              M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
            }
            var H = this._hash.words;
            var hl = _hl.words;
            var hr = _hr.words;
            var zl = _zl.words;
            var zr = _zr.words;
            var sl = _sl.words;
            var sr = _sr.words;
            var al, bl, cl, dl, el;
            var ar, br, cr, dr, er;
            ar = al = H[0];
            br = bl = H[1];
            cr = cl = H[2];
            dr = dl = H[3];
            er = el = H[4];
            var t;
            for (var i = 0; i < 80; i += 1) {
              t = al + M[offset + zl[i]] | 0;
              if (i < 16) {
                t += f1(bl, cl, dl) + hl[0];
              } else if (i < 32) {
                t += f2(bl, cl, dl) + hl[1];
              } else if (i < 48) {
                t += f3(bl, cl, dl) + hl[2];
              } else if (i < 64) {
                t += f4(bl, cl, dl) + hl[3];
              } else {
                t += f5(bl, cl, dl) + hl[4];
              }
              t = t | 0;
              t = rotl(t, sl[i]);
              t = t + el | 0;
              al = el;
              el = dl;
              dl = rotl(cl, 10);
              cl = bl;
              bl = t;
              t = ar + M[offset + zr[i]] | 0;
              if (i < 16) {
                t += f5(br, cr, dr) + hr[0];
              } else if (i < 32) {
                t += f4(br, cr, dr) + hr[1];
              } else if (i < 48) {
                t += f3(br, cr, dr) + hr[2];
              } else if (i < 64) {
                t += f2(br, cr, dr) + hr[3];
              } else {
                t += f1(br, cr, dr) + hr[4];
              }
              t = t | 0;
              t = rotl(t, sr[i]);
              t = t + er | 0;
              ar = er;
              er = dr;
              dr = rotl(cr, 10);
              cr = br;
              br = t;
            }
            t = H[1] + cl + dr | 0;
            H[1] = H[2] + dl + er | 0;
            H[2] = H[3] + el + ar | 0;
            H[3] = H[4] + al + br | 0;
            H[4] = H[0] + bl + cr | 0;
            H[0] = t;
          },
          _doFinalize: function() {
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 16711935 | (nBitsTotal << 24 | nBitsTotal >>> 8) & 4278255360;
            data.sigBytes = (dataWords.length + 1) * 4;
            this._process();
            var hash2 = this._hash;
            var H = hash2.words;
            for (var i = 0; i < 5; i++) {
              var H_i = H[i];
              H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
            }
            return hash2;
          },
          clone: function() {
            var clone2 = Hasher.clone.call(this);
            clone2._hash = this._hash.clone();
            return clone2;
          }
        });
        function f1(x, y, z) {
          return x ^ y ^ z;
        }
        function f2(x, y, z) {
          return x & y | ~x & z;
        }
        function f3(x, y, z) {
          return (x | ~y) ^ z;
        }
        function f4(x, y, z) {
          return x & z | y & ~z;
        }
        function f5(x, y, z) {
          return x ^ (y | ~z);
        }
        function rotl(x, n) {
          return x << n | x >>> 32 - n;
        }
        C.RIPEMD160 = Hasher._createHelper(RIPEMD160);
        C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
      })(Math);
      return CryptoJS.RIPEMD160;
    });
  }
});

// node_modules/crypto-js/hmac.js
var require_hmac = __commonJS({
  "node_modules/crypto-js/hmac.js"(exports, module2) {
    init_shims();
    (function(root, factory) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var C_enc = C.enc;
        var Utf8 = C_enc.Utf8;
        var C_algo = C.algo;
        var HMAC = C_algo.HMAC = Base.extend({
          init: function(hasher, key) {
            hasher = this._hasher = new hasher.init();
            if (typeof key == "string") {
              key = Utf8.parse(key);
            }
            var hasherBlockSize = hasher.blockSize;
            var hasherBlockSizeBytes = hasherBlockSize * 4;
            if (key.sigBytes > hasherBlockSizeBytes) {
              key = hasher.finalize(key);
            }
            key.clamp();
            var oKey = this._oKey = key.clone();
            var iKey = this._iKey = key.clone();
            var oKeyWords = oKey.words;
            var iKeyWords = iKey.words;
            for (var i = 0; i < hasherBlockSize; i++) {
              oKeyWords[i] ^= 1549556828;
              iKeyWords[i] ^= 909522486;
            }
            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
            this.reset();
          },
          reset: function() {
            var hasher = this._hasher;
            hasher.reset();
            hasher.update(this._iKey);
          },
          update: function(messageUpdate) {
            this._hasher.update(messageUpdate);
            return this;
          },
          finalize: function(messageUpdate) {
            var hasher = this._hasher;
            var innerHash = hasher.finalize(messageUpdate);
            hasher.reset();
            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
            return hmac;
          }
        });
      })();
    });
  }
});

// node_modules/crypto-js/pbkdf2.js
var require_pbkdf2 = __commonJS({
  "node_modules/crypto-js/pbkdf2.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_sha1(), require_hmac());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./sha1", "./hmac"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var WordArray = C_lib.WordArray;
        var C_algo = C.algo;
        var SHA1 = C_algo.SHA1;
        var HMAC = C_algo.HMAC;
        var PBKDF2 = C_algo.PBKDF2 = Base.extend({
          cfg: Base.extend({
            keySize: 128 / 32,
            hasher: SHA1,
            iterations: 1
          }),
          init: function(cfg) {
            this.cfg = this.cfg.extend(cfg);
          },
          compute: function(password, salt) {
            var cfg = this.cfg;
            var hmac = HMAC.create(cfg.hasher, password);
            var derivedKey = WordArray.create();
            var blockIndex = WordArray.create([1]);
            var derivedKeyWords = derivedKey.words;
            var blockIndexWords = blockIndex.words;
            var keySize = cfg.keySize;
            var iterations = cfg.iterations;
            while (derivedKeyWords.length < keySize) {
              var block = hmac.update(salt).finalize(blockIndex);
              hmac.reset();
              var blockWords = block.words;
              var blockWordsLength = blockWords.length;
              var intermediate = block;
              for (var i = 1; i < iterations; i++) {
                intermediate = hmac.finalize(intermediate);
                hmac.reset();
                var intermediateWords = intermediate.words;
                for (var j = 0; j < blockWordsLength; j++) {
                  blockWords[j] ^= intermediateWords[j];
                }
              }
              derivedKey.concat(block);
              blockIndexWords[0]++;
            }
            derivedKey.sigBytes = keySize * 4;
            return derivedKey;
          }
        });
        C.PBKDF2 = function(password, salt, cfg) {
          return PBKDF2.create(cfg).compute(password, salt);
        };
      })();
      return CryptoJS.PBKDF2;
    });
  }
});

// node_modules/crypto-js/evpkdf.js
var require_evpkdf = __commonJS({
  "node_modules/crypto-js/evpkdf.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_sha1(), require_hmac());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./sha1", "./hmac"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var WordArray = C_lib.WordArray;
        var C_algo = C.algo;
        var MD5 = C_algo.MD5;
        var EvpKDF = C_algo.EvpKDF = Base.extend({
          cfg: Base.extend({
            keySize: 128 / 32,
            hasher: MD5,
            iterations: 1
          }),
          init: function(cfg) {
            this.cfg = this.cfg.extend(cfg);
          },
          compute: function(password, salt) {
            var block;
            var cfg = this.cfg;
            var hasher = cfg.hasher.create();
            var derivedKey = WordArray.create();
            var derivedKeyWords = derivedKey.words;
            var keySize = cfg.keySize;
            var iterations = cfg.iterations;
            while (derivedKeyWords.length < keySize) {
              if (block) {
                hasher.update(block);
              }
              block = hasher.update(password).finalize(salt);
              hasher.reset();
              for (var i = 1; i < iterations; i++) {
                block = hasher.finalize(block);
                hasher.reset();
              }
              derivedKey.concat(block);
            }
            derivedKey.sigBytes = keySize * 4;
            return derivedKey;
          }
        });
        C.EvpKDF = function(password, salt, cfg) {
          return EvpKDF.create(cfg).compute(password, salt);
        };
      })();
      return CryptoJS.EvpKDF;
    });
  }
});

// node_modules/crypto-js/cipher-core.js
var require_cipher_core = __commonJS({
  "node_modules/crypto-js/cipher-core.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_evpkdf());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./evpkdf"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.lib.Cipher || function(undefined2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var WordArray = C_lib.WordArray;
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
        var C_enc = C.enc;
        var Utf8 = C_enc.Utf8;
        var Base64 = C_enc.Base64;
        var C_algo = C.algo;
        var EvpKDF = C_algo.EvpKDF;
        var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
          cfg: Base.extend(),
          createEncryptor: function(key, cfg) {
            return this.create(this._ENC_XFORM_MODE, key, cfg);
          },
          createDecryptor: function(key, cfg) {
            return this.create(this._DEC_XFORM_MODE, key, cfg);
          },
          init: function(xformMode, key, cfg) {
            this.cfg = this.cfg.extend(cfg);
            this._xformMode = xformMode;
            this._key = key;
            this.reset();
          },
          reset: function() {
            BufferedBlockAlgorithm.reset.call(this);
            this._doReset();
          },
          process: function(dataUpdate) {
            this._append(dataUpdate);
            return this._process();
          },
          finalize: function(dataUpdate) {
            if (dataUpdate) {
              this._append(dataUpdate);
            }
            var finalProcessedData = this._doFinalize();
            return finalProcessedData;
          },
          keySize: 128 / 32,
          ivSize: 128 / 32,
          _ENC_XFORM_MODE: 1,
          _DEC_XFORM_MODE: 2,
          _createHelper: function() {
            function selectCipherStrategy(key) {
              if (typeof key == "string") {
                return PasswordBasedCipher;
              } else {
                return SerializableCipher;
              }
            }
            return function(cipher) {
              return {
                encrypt: function(message, key, cfg) {
                  return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                },
                decrypt: function(ciphertext, key, cfg) {
                  return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                }
              };
            };
          }()
        });
        var StreamCipher = C_lib.StreamCipher = Cipher.extend({
          _doFinalize: function() {
            var finalProcessedBlocks = this._process(true);
            return finalProcessedBlocks;
          },
          blockSize: 1
        });
        var C_mode = C.mode = {};
        var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
          createEncryptor: function(cipher, iv) {
            return this.Encryptor.create(cipher, iv);
          },
          createDecryptor: function(cipher, iv) {
            return this.Decryptor.create(cipher, iv);
          },
          init: function(cipher, iv) {
            this._cipher = cipher;
            this._iv = iv;
          }
        });
        var CBC = C_mode.CBC = function() {
          var CBC2 = BlockCipherMode.extend();
          CBC2.Encryptor = CBC2.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              xorBlock.call(this, words, offset, blockSize);
              cipher.encryptBlock(words, offset);
              this._prevBlock = words.slice(offset, offset + blockSize);
            }
          });
          CBC2.Decryptor = CBC2.extend({
            processBlock: function(words, offset) {
              var cipher = this._cipher;
              var blockSize = cipher.blockSize;
              var thisBlock = words.slice(offset, offset + blockSize);
              cipher.decryptBlock(words, offset);
              xorBlock.call(this, words, offset, blockSize);
              this._prevBlock = thisBlock;
            }
          });
          function xorBlock(words, offset, blockSize) {
            var block;
            var iv = this._iv;
            if (iv) {
              block = iv;
              this._iv = undefined2;
            } else {
              block = this._prevBlock;
            }
            for (var i = 0; i < blockSize; i++) {
              words[offset + i] ^= block[i];
            }
          }
          return CBC2;
        }();
        var C_pad = C.pad = {};
        var Pkcs7 = C_pad.Pkcs7 = {
          pad: function(data, blockSize) {
            var blockSizeBytes = blockSize * 4;
            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
            var paddingWord = nPaddingBytes << 24 | nPaddingBytes << 16 | nPaddingBytes << 8 | nPaddingBytes;
            var paddingWords = [];
            for (var i = 0; i < nPaddingBytes; i += 4) {
              paddingWords.push(paddingWord);
            }
            var padding = WordArray.create(paddingWords, nPaddingBytes);
            data.concat(padding);
          },
          unpad: function(data) {
            var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
            data.sigBytes -= nPaddingBytes;
          }
        };
        var BlockCipher = C_lib.BlockCipher = Cipher.extend({
          cfg: Cipher.cfg.extend({
            mode: CBC,
            padding: Pkcs7
          }),
          reset: function() {
            var modeCreator;
            Cipher.reset.call(this);
            var cfg = this.cfg;
            var iv = cfg.iv;
            var mode = cfg.mode;
            if (this._xformMode == this._ENC_XFORM_MODE) {
              modeCreator = mode.createEncryptor;
            } else {
              modeCreator = mode.createDecryptor;
              this._minBufferSize = 1;
            }
            if (this._mode && this._mode.__creator == modeCreator) {
              this._mode.init(this, iv && iv.words);
            } else {
              this._mode = modeCreator.call(mode, this, iv && iv.words);
              this._mode.__creator = modeCreator;
            }
          },
          _doProcessBlock: function(words, offset) {
            this._mode.processBlock(words, offset);
          },
          _doFinalize: function() {
            var finalProcessedBlocks;
            var padding = this.cfg.padding;
            if (this._xformMode == this._ENC_XFORM_MODE) {
              padding.pad(this._data, this.blockSize);
              finalProcessedBlocks = this._process(true);
            } else {
              finalProcessedBlocks = this._process(true);
              padding.unpad(finalProcessedBlocks);
            }
            return finalProcessedBlocks;
          },
          blockSize: 128 / 32
        });
        var CipherParams = C_lib.CipherParams = Base.extend({
          init: function(cipherParams) {
            this.mixIn(cipherParams);
          },
          toString: function(formatter) {
            return (formatter || this.formatter).stringify(this);
          }
        });
        var C_format = C.format = {};
        var OpenSSLFormatter = C_format.OpenSSL = {
          stringify: function(cipherParams) {
            var wordArray;
            var ciphertext = cipherParams.ciphertext;
            var salt = cipherParams.salt;
            if (salt) {
              wordArray = WordArray.create([1398893684, 1701076831]).concat(salt).concat(ciphertext);
            } else {
              wordArray = ciphertext;
            }
            return wordArray.toString(Base64);
          },
          parse: function(openSSLStr) {
            var salt;
            var ciphertext = Base64.parse(openSSLStr);
            var ciphertextWords = ciphertext.words;
            if (ciphertextWords[0] == 1398893684 && ciphertextWords[1] == 1701076831) {
              salt = WordArray.create(ciphertextWords.slice(2, 4));
              ciphertextWords.splice(0, 4);
              ciphertext.sigBytes -= 16;
            }
            return CipherParams.create({ ciphertext, salt });
          }
        };
        var SerializableCipher = C_lib.SerializableCipher = Base.extend({
          cfg: Base.extend({
            format: OpenSSLFormatter
          }),
          encrypt: function(cipher, message, key, cfg) {
            cfg = this.cfg.extend(cfg);
            var encryptor = cipher.createEncryptor(key, cfg);
            var ciphertext = encryptor.finalize(message);
            var cipherCfg = encryptor.cfg;
            return CipherParams.create({
              ciphertext,
              key,
              iv: cipherCfg.iv,
              algorithm: cipher,
              mode: cipherCfg.mode,
              padding: cipherCfg.padding,
              blockSize: cipher.blockSize,
              formatter: cfg.format
            });
          },
          decrypt: function(cipher, ciphertext, key, cfg) {
            cfg = this.cfg.extend(cfg);
            ciphertext = this._parse(ciphertext, cfg.format);
            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
            return plaintext;
          },
          _parse: function(ciphertext, format2) {
            if (typeof ciphertext == "string") {
              return format2.parse(ciphertext, this);
            } else {
              return ciphertext;
            }
          }
        });
        var C_kdf = C.kdf = {};
        var OpenSSLKdf = C_kdf.OpenSSL = {
          execute: function(password, keySize, ivSize, salt) {
            if (!salt) {
              salt = WordArray.random(64 / 8);
            }
            var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
            key.sigBytes = keySize * 4;
            return CipherParams.create({ key, iv, salt });
          }
        };
        var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
          cfg: SerializableCipher.cfg.extend({
            kdf: OpenSSLKdf
          }),
          encrypt: function(cipher, message, password, cfg) {
            cfg = this.cfg.extend(cfg);
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);
            cfg.iv = derivedParams.iv;
            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
            ciphertext.mixIn(derivedParams);
            return ciphertext;
          },
          decrypt: function(cipher, ciphertext, password, cfg) {
            cfg = this.cfg.extend(cfg);
            ciphertext = this._parse(ciphertext, cfg.format);
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);
            cfg.iv = derivedParams.iv;
            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
            return plaintext;
          }
        });
      }();
    });
  }
});

// node_modules/crypto-js/mode-cfb.js
var require_mode_cfb = __commonJS({
  "node_modules/crypto-js/mode-cfb.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.mode.CFB = function() {
        var CFB = CryptoJS.lib.BlockCipherMode.extend();
        CFB.Encryptor = CFB.extend({
          processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
            this._prevBlock = words.slice(offset, offset + blockSize);
          }
        });
        CFB.Decryptor = CFB.extend({
          processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            var thisBlock = words.slice(offset, offset + blockSize);
            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
            this._prevBlock = thisBlock;
          }
        });
        function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
          var keystream;
          var iv = this._iv;
          if (iv) {
            keystream = iv.slice(0);
            this._iv = void 0;
          } else {
            keystream = this._prevBlock;
          }
          cipher.encryptBlock(keystream, 0);
          for (var i = 0; i < blockSize; i++) {
            words[offset + i] ^= keystream[i];
          }
        }
        return CFB;
      }();
      return CryptoJS.mode.CFB;
    });
  }
});

// node_modules/crypto-js/mode-ctr.js
var require_mode_ctr = __commonJS({
  "node_modules/crypto-js/mode-ctr.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.mode.CTR = function() {
        var CTR = CryptoJS.lib.BlockCipherMode.extend();
        var Encryptor = CTR.Encryptor = CTR.extend({
          processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var counter = this._counter;
            if (iv) {
              counter = this._counter = iv.slice(0);
              this._iv = void 0;
            }
            var keystream = counter.slice(0);
            cipher.encryptBlock(keystream, 0);
            counter[blockSize - 1] = counter[blockSize - 1] + 1 | 0;
            for (var i = 0; i < blockSize; i++) {
              words[offset + i] ^= keystream[i];
            }
          }
        });
        CTR.Decryptor = Encryptor;
        return CTR;
      }();
      return CryptoJS.mode.CTR;
    });
  }
});

// node_modules/crypto-js/mode-ctr-gladman.js
var require_mode_ctr_gladman = __commonJS({
  "node_modules/crypto-js/mode-ctr-gladman.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.mode.CTRGladman = function() {
        var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();
        function incWord(word) {
          if ((word >> 24 & 255) === 255) {
            var b1 = word >> 16 & 255;
            var b2 = word >> 8 & 255;
            var b3 = word & 255;
            if (b1 === 255) {
              b1 = 0;
              if (b2 === 255) {
                b2 = 0;
                if (b3 === 255) {
                  b3 = 0;
                } else {
                  ++b3;
                }
              } else {
                ++b2;
              }
            } else {
              ++b1;
            }
            word = 0;
            word += b1 << 16;
            word += b2 << 8;
            word += b3;
          } else {
            word += 1 << 24;
          }
          return word;
        }
        function incCounter(counter) {
          if ((counter[0] = incWord(counter[0])) === 0) {
            counter[1] = incWord(counter[1]);
          }
          return counter;
        }
        var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
          processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var counter = this._counter;
            if (iv) {
              counter = this._counter = iv.slice(0);
              this._iv = void 0;
            }
            incCounter(counter);
            var keystream = counter.slice(0);
            cipher.encryptBlock(keystream, 0);
            for (var i = 0; i < blockSize; i++) {
              words[offset + i] ^= keystream[i];
            }
          }
        });
        CTRGladman.Decryptor = Encryptor;
        return CTRGladman;
      }();
      return CryptoJS.mode.CTRGladman;
    });
  }
});

// node_modules/crypto-js/mode-ofb.js
var require_mode_ofb = __commonJS({
  "node_modules/crypto-js/mode-ofb.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.mode.OFB = function() {
        var OFB = CryptoJS.lib.BlockCipherMode.extend();
        var Encryptor = OFB.Encryptor = OFB.extend({
          processBlock: function(words, offset) {
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var keystream = this._keystream;
            if (iv) {
              keystream = this._keystream = iv.slice(0);
              this._iv = void 0;
            }
            cipher.encryptBlock(keystream, 0);
            for (var i = 0; i < blockSize; i++) {
              words[offset + i] ^= keystream[i];
            }
          }
        });
        OFB.Decryptor = Encryptor;
        return OFB;
      }();
      return CryptoJS.mode.OFB;
    });
  }
});

// node_modules/crypto-js/mode-ecb.js
var require_mode_ecb = __commonJS({
  "node_modules/crypto-js/mode-ecb.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.mode.ECB = function() {
        var ECB = CryptoJS.lib.BlockCipherMode.extend();
        ECB.Encryptor = ECB.extend({
          processBlock: function(words, offset) {
            this._cipher.encryptBlock(words, offset);
          }
        });
        ECB.Decryptor = ECB.extend({
          processBlock: function(words, offset) {
            this._cipher.decryptBlock(words, offset);
          }
        });
        return ECB;
      }();
      return CryptoJS.mode.ECB;
    });
  }
});

// node_modules/crypto-js/pad-ansix923.js
var require_pad_ansix923 = __commonJS({
  "node_modules/crypto-js/pad-ansix923.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.pad.AnsiX923 = {
        pad: function(data, blockSize) {
          var dataSigBytes = data.sigBytes;
          var blockSizeBytes = blockSize * 4;
          var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
          var lastBytePos = dataSigBytes + nPaddingBytes - 1;
          data.clamp();
          data.words[lastBytePos >>> 2] |= nPaddingBytes << 24 - lastBytePos % 4 * 8;
          data.sigBytes += nPaddingBytes;
        },
        unpad: function(data) {
          var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
          data.sigBytes -= nPaddingBytes;
        }
      };
      return CryptoJS.pad.Ansix923;
    });
  }
});

// node_modules/crypto-js/pad-iso10126.js
var require_pad_iso10126 = __commonJS({
  "node_modules/crypto-js/pad-iso10126.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.pad.Iso10126 = {
        pad: function(data, blockSize) {
          var blockSizeBytes = blockSize * 4;
          var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
          data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
        },
        unpad: function(data) {
          var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
          data.sigBytes -= nPaddingBytes;
        }
      };
      return CryptoJS.pad.Iso10126;
    });
  }
});

// node_modules/crypto-js/pad-iso97971.js
var require_pad_iso97971 = __commonJS({
  "node_modules/crypto-js/pad-iso97971.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.pad.Iso97971 = {
        pad: function(data, blockSize) {
          data.concat(CryptoJS.lib.WordArray.create([2147483648], 1));
          CryptoJS.pad.ZeroPadding.pad(data, blockSize);
        },
        unpad: function(data) {
          CryptoJS.pad.ZeroPadding.unpad(data);
          data.sigBytes--;
        }
      };
      return CryptoJS.pad.Iso97971;
    });
  }
});

// node_modules/crypto-js/pad-zeropadding.js
var require_pad_zeropadding = __commonJS({
  "node_modules/crypto-js/pad-zeropadding.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.pad.ZeroPadding = {
        pad: function(data, blockSize) {
          var blockSizeBytes = blockSize * 4;
          data.clamp();
          data.sigBytes += blockSizeBytes - (data.sigBytes % blockSizeBytes || blockSizeBytes);
        },
        unpad: function(data) {
          var dataWords = data.words;
          var i = data.sigBytes - 1;
          for (var i = data.sigBytes - 1; i >= 0; i--) {
            if (dataWords[i >>> 2] >>> 24 - i % 4 * 8 & 255) {
              data.sigBytes = i + 1;
              break;
            }
          }
        }
      };
      return CryptoJS.pad.ZeroPadding;
    });
  }
});

// node_modules/crypto-js/pad-nopadding.js
var require_pad_nopadding = __commonJS({
  "node_modules/crypto-js/pad-nopadding.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      CryptoJS.pad.NoPadding = {
        pad: function() {
        },
        unpad: function() {
        }
      };
      return CryptoJS.pad.NoPadding;
    });
  }
});

// node_modules/crypto-js/format-hex.js
var require_format_hex = __commonJS({
  "node_modules/crypto-js/format-hex.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function(undefined2) {
        var C = CryptoJS;
        var C_lib = C.lib;
        var CipherParams = C_lib.CipherParams;
        var C_enc = C.enc;
        var Hex = C_enc.Hex;
        var C_format = C.format;
        var HexFormatter = C_format.Hex = {
          stringify: function(cipherParams) {
            return cipherParams.ciphertext.toString(Hex);
          },
          parse: function(input) {
            var ciphertext = Hex.parse(input);
            return CipherParams.create({ ciphertext });
          }
        };
      })();
      return CryptoJS.format.Hex;
    });
  }
});

// node_modules/crypto-js/aes.js
var require_aes = __commonJS({
  "node_modules/crypto-js/aes.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var BlockCipher = C_lib.BlockCipher;
        var C_algo = C.algo;
        var SBOX = [];
        var INV_SBOX = [];
        var SUB_MIX_0 = [];
        var SUB_MIX_1 = [];
        var SUB_MIX_2 = [];
        var SUB_MIX_3 = [];
        var INV_SUB_MIX_0 = [];
        var INV_SUB_MIX_1 = [];
        var INV_SUB_MIX_2 = [];
        var INV_SUB_MIX_3 = [];
        (function() {
          var d2 = [];
          for (var i = 0; i < 256; i++) {
            if (i < 128) {
              d2[i] = i << 1;
            } else {
              d2[i] = i << 1 ^ 283;
            }
          }
          var x = 0;
          var xi = 0;
          for (var i = 0; i < 256; i++) {
            var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
            sx = sx >>> 8 ^ sx & 255 ^ 99;
            SBOX[x] = sx;
            INV_SBOX[sx] = x;
            var x2 = d2[x];
            var x4 = d2[x2];
            var x8 = d2[x4];
            var t = d2[sx] * 257 ^ sx * 16843008;
            SUB_MIX_0[x] = t << 24 | t >>> 8;
            SUB_MIX_1[x] = t << 16 | t >>> 16;
            SUB_MIX_2[x] = t << 8 | t >>> 24;
            SUB_MIX_3[x] = t;
            var t = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
            INV_SUB_MIX_0[sx] = t << 24 | t >>> 8;
            INV_SUB_MIX_1[sx] = t << 16 | t >>> 16;
            INV_SUB_MIX_2[sx] = t << 8 | t >>> 24;
            INV_SUB_MIX_3[sx] = t;
            if (!x) {
              x = xi = 1;
            } else {
              x = x2 ^ d2[d2[d2[x8 ^ x2]]];
              xi ^= d2[d2[xi]];
            }
          }
        })();
        var RCON = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
        var AES = C_algo.AES = BlockCipher.extend({
          _doReset: function() {
            var t;
            if (this._nRounds && this._keyPriorReset === this._key) {
              return;
            }
            var key = this._keyPriorReset = this._key;
            var keyWords = key.words;
            var keySize = key.sigBytes / 4;
            var nRounds = this._nRounds = keySize + 6;
            var ksRows = (nRounds + 1) * 4;
            var keySchedule = this._keySchedule = [];
            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
              if (ksRow < keySize) {
                keySchedule[ksRow] = keyWords[ksRow];
              } else {
                t = keySchedule[ksRow - 1];
                if (!(ksRow % keySize)) {
                  t = t << 8 | t >>> 24;
                  t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
                  t ^= RCON[ksRow / keySize | 0] << 24;
                } else if (keySize > 6 && ksRow % keySize == 4) {
                  t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
                }
                keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
              }
            }
            var invKeySchedule = this._invKeySchedule = [];
            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
              var ksRow = ksRows - invKsRow;
              if (invKsRow % 4) {
                var t = keySchedule[ksRow];
              } else {
                var t = keySchedule[ksRow - 4];
              }
              if (invKsRow < 4 || ksRow <= 4) {
                invKeySchedule[invKsRow] = t;
              } else {
                invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[t >>> 16 & 255]] ^ INV_SUB_MIX_2[SBOX[t >>> 8 & 255]] ^ INV_SUB_MIX_3[SBOX[t & 255]];
              }
            }
          },
          encryptBlock: function(M, offset) {
            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
          },
          decryptBlock: function(M, offset) {
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;
            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;
          },
          _doCryptBlock: function(M, offset, keySchedule, SUB_MIX_02, SUB_MIX_12, SUB_MIX_22, SUB_MIX_32, SBOX2) {
            var nRounds = this._nRounds;
            var s0 = M[offset] ^ keySchedule[0];
            var s1 = M[offset + 1] ^ keySchedule[1];
            var s2 = M[offset + 2] ^ keySchedule[2];
            var s3 = M[offset + 3] ^ keySchedule[3];
            var ksRow = 4;
            for (var round = 1; round < nRounds; round++) {
              var t0 = SUB_MIX_02[s0 >>> 24] ^ SUB_MIX_12[s1 >>> 16 & 255] ^ SUB_MIX_22[s2 >>> 8 & 255] ^ SUB_MIX_32[s3 & 255] ^ keySchedule[ksRow++];
              var t1 = SUB_MIX_02[s1 >>> 24] ^ SUB_MIX_12[s2 >>> 16 & 255] ^ SUB_MIX_22[s3 >>> 8 & 255] ^ SUB_MIX_32[s0 & 255] ^ keySchedule[ksRow++];
              var t2 = SUB_MIX_02[s2 >>> 24] ^ SUB_MIX_12[s3 >>> 16 & 255] ^ SUB_MIX_22[s0 >>> 8 & 255] ^ SUB_MIX_32[s1 & 255] ^ keySchedule[ksRow++];
              var t3 = SUB_MIX_02[s3 >>> 24] ^ SUB_MIX_12[s0 >>> 16 & 255] ^ SUB_MIX_22[s1 >>> 8 & 255] ^ SUB_MIX_32[s2 & 255] ^ keySchedule[ksRow++];
              s0 = t0;
              s1 = t1;
              s2 = t2;
              s3 = t3;
            }
            var t0 = (SBOX2[s0 >>> 24] << 24 | SBOX2[s1 >>> 16 & 255] << 16 | SBOX2[s2 >>> 8 & 255] << 8 | SBOX2[s3 & 255]) ^ keySchedule[ksRow++];
            var t1 = (SBOX2[s1 >>> 24] << 24 | SBOX2[s2 >>> 16 & 255] << 16 | SBOX2[s3 >>> 8 & 255] << 8 | SBOX2[s0 & 255]) ^ keySchedule[ksRow++];
            var t2 = (SBOX2[s2 >>> 24] << 24 | SBOX2[s3 >>> 16 & 255] << 16 | SBOX2[s0 >>> 8 & 255] << 8 | SBOX2[s1 & 255]) ^ keySchedule[ksRow++];
            var t3 = (SBOX2[s3 >>> 24] << 24 | SBOX2[s0 >>> 16 & 255] << 16 | SBOX2[s1 >>> 8 & 255] << 8 | SBOX2[s2 & 255]) ^ keySchedule[ksRow++];
            M[offset] = t0;
            M[offset + 1] = t1;
            M[offset + 2] = t2;
            M[offset + 3] = t3;
          },
          keySize: 256 / 32
        });
        C.AES = BlockCipher._createHelper(AES);
      })();
      return CryptoJS.AES;
    });
  }
});

// node_modules/crypto-js/tripledes.js
var require_tripledes = __commonJS({
  "node_modules/crypto-js/tripledes.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var BlockCipher = C_lib.BlockCipher;
        var C_algo = C.algo;
        var PC1 = [
          57,
          49,
          41,
          33,
          25,
          17,
          9,
          1,
          58,
          50,
          42,
          34,
          26,
          18,
          10,
          2,
          59,
          51,
          43,
          35,
          27,
          19,
          11,
          3,
          60,
          52,
          44,
          36,
          63,
          55,
          47,
          39,
          31,
          23,
          15,
          7,
          62,
          54,
          46,
          38,
          30,
          22,
          14,
          6,
          61,
          53,
          45,
          37,
          29,
          21,
          13,
          5,
          28,
          20,
          12,
          4
        ];
        var PC2 = [
          14,
          17,
          11,
          24,
          1,
          5,
          3,
          28,
          15,
          6,
          21,
          10,
          23,
          19,
          12,
          4,
          26,
          8,
          16,
          7,
          27,
          20,
          13,
          2,
          41,
          52,
          31,
          37,
          47,
          55,
          30,
          40,
          51,
          45,
          33,
          48,
          44,
          49,
          39,
          56,
          34,
          53,
          46,
          42,
          50,
          36,
          29,
          32
        ];
        var BIT_SHIFTS = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];
        var SBOX_P = [
          {
            0: 8421888,
            268435456: 32768,
            536870912: 8421378,
            805306368: 2,
            1073741824: 512,
            1342177280: 8421890,
            1610612736: 8389122,
            1879048192: 8388608,
            2147483648: 514,
            2415919104: 8389120,
            2684354560: 33280,
            2952790016: 8421376,
            3221225472: 32770,
            3489660928: 8388610,
            3758096384: 0,
            4026531840: 33282,
            134217728: 0,
            402653184: 8421890,
            671088640: 33282,
            939524096: 32768,
            1207959552: 8421888,
            1476395008: 512,
            1744830464: 8421378,
            2013265920: 2,
            2281701376: 8389120,
            2550136832: 33280,
            2818572288: 8421376,
            3087007744: 8389122,
            3355443200: 8388610,
            3623878656: 32770,
            3892314112: 514,
            4160749568: 8388608,
            1: 32768,
            268435457: 2,
            536870913: 8421888,
            805306369: 8388608,
            1073741825: 8421378,
            1342177281: 33280,
            1610612737: 512,
            1879048193: 8389122,
            2147483649: 8421890,
            2415919105: 8421376,
            2684354561: 8388610,
            2952790017: 33282,
            3221225473: 514,
            3489660929: 8389120,
            3758096385: 32770,
            4026531841: 0,
            134217729: 8421890,
            402653185: 8421376,
            671088641: 8388608,
            939524097: 512,
            1207959553: 32768,
            1476395009: 8388610,
            1744830465: 2,
            2013265921: 33282,
            2281701377: 32770,
            2550136833: 8389122,
            2818572289: 514,
            3087007745: 8421888,
            3355443201: 8389120,
            3623878657: 0,
            3892314113: 33280,
            4160749569: 8421378
          },
          {
            0: 1074282512,
            16777216: 16384,
            33554432: 524288,
            50331648: 1074266128,
            67108864: 1073741840,
            83886080: 1074282496,
            100663296: 1073758208,
            117440512: 16,
            134217728: 540672,
            150994944: 1073758224,
            167772160: 1073741824,
            184549376: 540688,
            201326592: 524304,
            218103808: 0,
            234881024: 16400,
            251658240: 1074266112,
            8388608: 1073758208,
            25165824: 540688,
            41943040: 16,
            58720256: 1073758224,
            75497472: 1074282512,
            92274688: 1073741824,
            109051904: 524288,
            125829120: 1074266128,
            142606336: 524304,
            159383552: 0,
            176160768: 16384,
            192937984: 1074266112,
            209715200: 1073741840,
            226492416: 540672,
            243269632: 1074282496,
            260046848: 16400,
            268435456: 0,
            285212672: 1074266128,
            301989888: 1073758224,
            318767104: 1074282496,
            335544320: 1074266112,
            352321536: 16,
            369098752: 540688,
            385875968: 16384,
            402653184: 16400,
            419430400: 524288,
            436207616: 524304,
            452984832: 1073741840,
            469762048: 540672,
            486539264: 1073758208,
            503316480: 1073741824,
            520093696: 1074282512,
            276824064: 540688,
            293601280: 524288,
            310378496: 1074266112,
            327155712: 16384,
            343932928: 1073758208,
            360710144: 1074282512,
            377487360: 16,
            394264576: 1073741824,
            411041792: 1074282496,
            427819008: 1073741840,
            444596224: 1073758224,
            461373440: 524304,
            478150656: 0,
            494927872: 16400,
            511705088: 1074266128,
            528482304: 540672
          },
          {
            0: 260,
            1048576: 0,
            2097152: 67109120,
            3145728: 65796,
            4194304: 65540,
            5242880: 67108868,
            6291456: 67174660,
            7340032: 67174400,
            8388608: 67108864,
            9437184: 67174656,
            10485760: 65792,
            11534336: 67174404,
            12582912: 67109124,
            13631488: 65536,
            14680064: 4,
            15728640: 256,
            524288: 67174656,
            1572864: 67174404,
            2621440: 0,
            3670016: 67109120,
            4718592: 67108868,
            5767168: 65536,
            6815744: 65540,
            7864320: 260,
            8912896: 4,
            9961472: 256,
            11010048: 67174400,
            12058624: 65796,
            13107200: 65792,
            14155776: 67109124,
            15204352: 67174660,
            16252928: 67108864,
            16777216: 67174656,
            17825792: 65540,
            18874368: 65536,
            19922944: 67109120,
            20971520: 256,
            22020096: 67174660,
            23068672: 67108868,
            24117248: 0,
            25165824: 67109124,
            26214400: 67108864,
            27262976: 4,
            28311552: 65792,
            29360128: 67174400,
            30408704: 260,
            31457280: 65796,
            32505856: 67174404,
            17301504: 67108864,
            18350080: 260,
            19398656: 67174656,
            20447232: 0,
            21495808: 65540,
            22544384: 67109120,
            23592960: 256,
            24641536: 67174404,
            25690112: 65536,
            26738688: 67174660,
            27787264: 65796,
            28835840: 67108868,
            29884416: 67109124,
            30932992: 67174400,
            31981568: 4,
            33030144: 65792
          },
          {
            0: 2151682048,
            65536: 2147487808,
            131072: 4198464,
            196608: 2151677952,
            262144: 0,
            327680: 4198400,
            393216: 2147483712,
            458752: 4194368,
            524288: 2147483648,
            589824: 4194304,
            655360: 64,
            720896: 2147487744,
            786432: 2151678016,
            851968: 4160,
            917504: 4096,
            983040: 2151682112,
            32768: 2147487808,
            98304: 64,
            163840: 2151678016,
            229376: 2147487744,
            294912: 4198400,
            360448: 2151682112,
            425984: 0,
            491520: 2151677952,
            557056: 4096,
            622592: 2151682048,
            688128: 4194304,
            753664: 4160,
            819200: 2147483648,
            884736: 4194368,
            950272: 4198464,
            1015808: 2147483712,
            1048576: 4194368,
            1114112: 4198400,
            1179648: 2147483712,
            1245184: 0,
            1310720: 4160,
            1376256: 2151678016,
            1441792: 2151682048,
            1507328: 2147487808,
            1572864: 2151682112,
            1638400: 2147483648,
            1703936: 2151677952,
            1769472: 4198464,
            1835008: 2147487744,
            1900544: 4194304,
            1966080: 64,
            2031616: 4096,
            1081344: 2151677952,
            1146880: 2151682112,
            1212416: 0,
            1277952: 4198400,
            1343488: 4194368,
            1409024: 2147483648,
            1474560: 2147487808,
            1540096: 64,
            1605632: 2147483712,
            1671168: 4096,
            1736704: 2147487744,
            1802240: 2151678016,
            1867776: 4160,
            1933312: 2151682048,
            1998848: 4194304,
            2064384: 4198464
          },
          {
            0: 128,
            4096: 17039360,
            8192: 262144,
            12288: 536870912,
            16384: 537133184,
            20480: 16777344,
            24576: 553648256,
            28672: 262272,
            32768: 16777216,
            36864: 537133056,
            40960: 536871040,
            45056: 553910400,
            49152: 553910272,
            53248: 0,
            57344: 17039488,
            61440: 553648128,
            2048: 17039488,
            6144: 553648256,
            10240: 128,
            14336: 17039360,
            18432: 262144,
            22528: 537133184,
            26624: 553910272,
            30720: 536870912,
            34816: 537133056,
            38912: 0,
            43008: 553910400,
            47104: 16777344,
            51200: 536871040,
            55296: 553648128,
            59392: 16777216,
            63488: 262272,
            65536: 262144,
            69632: 128,
            73728: 536870912,
            77824: 553648256,
            81920: 16777344,
            86016: 553910272,
            90112: 537133184,
            94208: 16777216,
            98304: 553910400,
            102400: 553648128,
            106496: 17039360,
            110592: 537133056,
            114688: 262272,
            118784: 536871040,
            122880: 0,
            126976: 17039488,
            67584: 553648256,
            71680: 16777216,
            75776: 17039360,
            79872: 537133184,
            83968: 536870912,
            88064: 17039488,
            92160: 128,
            96256: 553910272,
            100352: 262272,
            104448: 553910400,
            108544: 0,
            112640: 553648128,
            116736: 16777344,
            120832: 262144,
            124928: 537133056,
            129024: 536871040
          },
          {
            0: 268435464,
            256: 8192,
            512: 270532608,
            768: 270540808,
            1024: 268443648,
            1280: 2097152,
            1536: 2097160,
            1792: 268435456,
            2048: 0,
            2304: 268443656,
            2560: 2105344,
            2816: 8,
            3072: 270532616,
            3328: 2105352,
            3584: 8200,
            3840: 270540800,
            128: 270532608,
            384: 270540808,
            640: 8,
            896: 2097152,
            1152: 2105352,
            1408: 268435464,
            1664: 268443648,
            1920: 8200,
            2176: 2097160,
            2432: 8192,
            2688: 268443656,
            2944: 270532616,
            3200: 0,
            3456: 270540800,
            3712: 2105344,
            3968: 268435456,
            4096: 268443648,
            4352: 270532616,
            4608: 270540808,
            4864: 8200,
            5120: 2097152,
            5376: 268435456,
            5632: 268435464,
            5888: 2105344,
            6144: 2105352,
            6400: 0,
            6656: 8,
            6912: 270532608,
            7168: 8192,
            7424: 268443656,
            7680: 270540800,
            7936: 2097160,
            4224: 8,
            4480: 2105344,
            4736: 2097152,
            4992: 268435464,
            5248: 268443648,
            5504: 8200,
            5760: 270540808,
            6016: 270532608,
            6272: 270540800,
            6528: 270532616,
            6784: 8192,
            7040: 2105352,
            7296: 2097160,
            7552: 0,
            7808: 268435456,
            8064: 268443656
          },
          {
            0: 1048576,
            16: 33555457,
            32: 1024,
            48: 1049601,
            64: 34604033,
            80: 0,
            96: 1,
            112: 34603009,
            128: 33555456,
            144: 1048577,
            160: 33554433,
            176: 34604032,
            192: 34603008,
            208: 1025,
            224: 1049600,
            240: 33554432,
            8: 34603009,
            24: 0,
            40: 33555457,
            56: 34604032,
            72: 1048576,
            88: 33554433,
            104: 33554432,
            120: 1025,
            136: 1049601,
            152: 33555456,
            168: 34603008,
            184: 1048577,
            200: 1024,
            216: 34604033,
            232: 1,
            248: 1049600,
            256: 33554432,
            272: 1048576,
            288: 33555457,
            304: 34603009,
            320: 1048577,
            336: 33555456,
            352: 34604032,
            368: 1049601,
            384: 1025,
            400: 34604033,
            416: 1049600,
            432: 1,
            448: 0,
            464: 34603008,
            480: 33554433,
            496: 1024,
            264: 1049600,
            280: 33555457,
            296: 34603009,
            312: 1,
            328: 33554432,
            344: 1048576,
            360: 1025,
            376: 34604032,
            392: 33554433,
            408: 34603008,
            424: 0,
            440: 34604033,
            456: 1049601,
            472: 1024,
            488: 33555456,
            504: 1048577
          },
          {
            0: 134219808,
            1: 131072,
            2: 134217728,
            3: 32,
            4: 131104,
            5: 134350880,
            6: 134350848,
            7: 2048,
            8: 134348800,
            9: 134219776,
            10: 133120,
            11: 134348832,
            12: 2080,
            13: 0,
            14: 134217760,
            15: 133152,
            2147483648: 2048,
            2147483649: 134350880,
            2147483650: 134219808,
            2147483651: 134217728,
            2147483652: 134348800,
            2147483653: 133120,
            2147483654: 133152,
            2147483655: 32,
            2147483656: 134217760,
            2147483657: 2080,
            2147483658: 131104,
            2147483659: 134350848,
            2147483660: 0,
            2147483661: 134348832,
            2147483662: 134219776,
            2147483663: 131072,
            16: 133152,
            17: 134350848,
            18: 32,
            19: 2048,
            20: 134219776,
            21: 134217760,
            22: 134348832,
            23: 131072,
            24: 0,
            25: 131104,
            26: 134348800,
            27: 134219808,
            28: 134350880,
            29: 133120,
            30: 2080,
            31: 134217728,
            2147483664: 131072,
            2147483665: 2048,
            2147483666: 134348832,
            2147483667: 133152,
            2147483668: 32,
            2147483669: 134348800,
            2147483670: 134217728,
            2147483671: 134219808,
            2147483672: 134350880,
            2147483673: 134217760,
            2147483674: 134219776,
            2147483675: 0,
            2147483676: 133120,
            2147483677: 2080,
            2147483678: 131104,
            2147483679: 134350848
          }
        ];
        var SBOX_MASK = [
          4160749569,
          528482304,
          33030144,
          2064384,
          129024,
          8064,
          504,
          2147483679
        ];
        var DES = C_algo.DES = BlockCipher.extend({
          _doReset: function() {
            var key = this._key;
            var keyWords = key.words;
            var keyBits = [];
            for (var i = 0; i < 56; i++) {
              var keyBitPos = PC1[i] - 1;
              keyBits[i] = keyWords[keyBitPos >>> 5] >>> 31 - keyBitPos % 32 & 1;
            }
            var subKeys = this._subKeys = [];
            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
              var subKey = subKeys[nSubKey] = [];
              var bitShift = BIT_SHIFTS[nSubKey];
              for (var i = 0; i < 24; i++) {
                subKey[i / 6 | 0] |= keyBits[(PC2[i] - 1 + bitShift) % 28] << 31 - i % 6;
                subKey[4 + (i / 6 | 0)] |= keyBits[28 + (PC2[i + 24] - 1 + bitShift) % 28] << 31 - i % 6;
              }
              subKey[0] = subKey[0] << 1 | subKey[0] >>> 31;
              for (var i = 1; i < 7; i++) {
                subKey[i] = subKey[i] >>> (i - 1) * 4 + 3;
              }
              subKey[7] = subKey[7] << 5 | subKey[7] >>> 27;
            }
            var invSubKeys = this._invSubKeys = [];
            for (var i = 0; i < 16; i++) {
              invSubKeys[i] = subKeys[15 - i];
            }
          },
          encryptBlock: function(M, offset) {
            this._doCryptBlock(M, offset, this._subKeys);
          },
          decryptBlock: function(M, offset) {
            this._doCryptBlock(M, offset, this._invSubKeys);
          },
          _doCryptBlock: function(M, offset, subKeys) {
            this._lBlock = M[offset];
            this._rBlock = M[offset + 1];
            exchangeLR.call(this, 4, 252645135);
            exchangeLR.call(this, 16, 65535);
            exchangeRL.call(this, 2, 858993459);
            exchangeRL.call(this, 8, 16711935);
            exchangeLR.call(this, 1, 1431655765);
            for (var round = 0; round < 16; round++) {
              var subKey = subKeys[round];
              var lBlock = this._lBlock;
              var rBlock = this._rBlock;
              var f = 0;
              for (var i = 0; i < 8; i++) {
                f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
              }
              this._lBlock = rBlock;
              this._rBlock = lBlock ^ f;
            }
            var t = this._lBlock;
            this._lBlock = this._rBlock;
            this._rBlock = t;
            exchangeLR.call(this, 1, 1431655765);
            exchangeRL.call(this, 8, 16711935);
            exchangeRL.call(this, 2, 858993459);
            exchangeLR.call(this, 16, 65535);
            exchangeLR.call(this, 4, 252645135);
            M[offset] = this._lBlock;
            M[offset + 1] = this._rBlock;
          },
          keySize: 64 / 32,
          ivSize: 64 / 32,
          blockSize: 64 / 32
        });
        function exchangeLR(offset, mask) {
          var t = (this._lBlock >>> offset ^ this._rBlock) & mask;
          this._rBlock ^= t;
          this._lBlock ^= t << offset;
        }
        function exchangeRL(offset, mask) {
          var t = (this._rBlock >>> offset ^ this._lBlock) & mask;
          this._lBlock ^= t;
          this._rBlock ^= t << offset;
        }
        C.DES = BlockCipher._createHelper(DES);
        var TripleDES = C_algo.TripleDES = BlockCipher.extend({
          _doReset: function() {
            var key = this._key;
            var keyWords = key.words;
            if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) {
              throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
            }
            var key1 = keyWords.slice(0, 2);
            var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
            var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);
            this._des1 = DES.createEncryptor(WordArray.create(key1));
            this._des2 = DES.createEncryptor(WordArray.create(key2));
            this._des3 = DES.createEncryptor(WordArray.create(key3));
          },
          encryptBlock: function(M, offset) {
            this._des1.encryptBlock(M, offset);
            this._des2.decryptBlock(M, offset);
            this._des3.encryptBlock(M, offset);
          },
          decryptBlock: function(M, offset) {
            this._des3.decryptBlock(M, offset);
            this._des2.encryptBlock(M, offset);
            this._des1.decryptBlock(M, offset);
          },
          keySize: 192 / 32,
          ivSize: 64 / 32,
          blockSize: 64 / 32
        });
        C.TripleDES = BlockCipher._createHelper(TripleDES);
      })();
      return CryptoJS.TripleDES;
    });
  }
});

// node_modules/crypto-js/rc4.js
var require_rc4 = __commonJS({
  "node_modules/crypto-js/rc4.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var StreamCipher = C_lib.StreamCipher;
        var C_algo = C.algo;
        var RC4 = C_algo.RC4 = StreamCipher.extend({
          _doReset: function() {
            var key = this._key;
            var keyWords = key.words;
            var keySigBytes = key.sigBytes;
            var S = this._S = [];
            for (var i = 0; i < 256; i++) {
              S[i] = i;
            }
            for (var i = 0, j = 0; i < 256; i++) {
              var keyByteIndex = i % keySigBytes;
              var keyByte = keyWords[keyByteIndex >>> 2] >>> 24 - keyByteIndex % 4 * 8 & 255;
              j = (j + S[i] + keyByte) % 256;
              var t = S[i];
              S[i] = S[j];
              S[j] = t;
            }
            this._i = this._j = 0;
          },
          _doProcessBlock: function(M, offset) {
            M[offset] ^= generateKeystreamWord.call(this);
          },
          keySize: 256 / 32,
          ivSize: 0
        });
        function generateKeystreamWord() {
          var S = this._S;
          var i = this._i;
          var j = this._j;
          var keystreamWord = 0;
          for (var n = 0; n < 4; n++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;
            var t = S[i];
            S[i] = S[j];
            S[j] = t;
            keystreamWord |= S[(S[i] + S[j]) % 256] << 24 - n * 8;
          }
          this._i = i;
          this._j = j;
          return keystreamWord;
        }
        C.RC4 = StreamCipher._createHelper(RC4);
        var RC4Drop = C_algo.RC4Drop = RC4.extend({
          cfg: RC4.cfg.extend({
            drop: 192
          }),
          _doReset: function() {
            RC4._doReset.call(this);
            for (var i = this.cfg.drop; i > 0; i--) {
              generateKeystreamWord.call(this);
            }
          }
        });
        C.RC4Drop = StreamCipher._createHelper(RC4Drop);
      })();
      return CryptoJS.RC4;
    });
  }
});

// node_modules/crypto-js/rabbit.js
var require_rabbit = __commonJS({
  "node_modules/crypto-js/rabbit.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var StreamCipher = C_lib.StreamCipher;
        var C_algo = C.algo;
        var S = [];
        var C_ = [];
        var G = [];
        var Rabbit = C_algo.Rabbit = StreamCipher.extend({
          _doReset: function() {
            var K = this._key.words;
            var iv = this.cfg.iv;
            for (var i = 0; i < 4; i++) {
              K[i] = (K[i] << 8 | K[i] >>> 24) & 16711935 | (K[i] << 24 | K[i] >>> 8) & 4278255360;
            }
            var X = this._X = [
              K[0],
              K[3] << 16 | K[2] >>> 16,
              K[1],
              K[0] << 16 | K[3] >>> 16,
              K[2],
              K[1] << 16 | K[0] >>> 16,
              K[3],
              K[2] << 16 | K[1] >>> 16
            ];
            var C2 = this._C = [
              K[2] << 16 | K[2] >>> 16,
              K[0] & 4294901760 | K[1] & 65535,
              K[3] << 16 | K[3] >>> 16,
              K[1] & 4294901760 | K[2] & 65535,
              K[0] << 16 | K[0] >>> 16,
              K[2] & 4294901760 | K[3] & 65535,
              K[1] << 16 | K[1] >>> 16,
              K[3] & 4294901760 | K[0] & 65535
            ];
            this._b = 0;
            for (var i = 0; i < 4; i++) {
              nextState.call(this);
            }
            for (var i = 0; i < 8; i++) {
              C2[i] ^= X[i + 4 & 7];
            }
            if (iv) {
              var IV = iv.words;
              var IV_0 = IV[0];
              var IV_1 = IV[1];
              var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
              var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
              var i1 = i0 >>> 16 | i2 & 4294901760;
              var i3 = i2 << 16 | i0 & 65535;
              C2[0] ^= i0;
              C2[1] ^= i1;
              C2[2] ^= i2;
              C2[3] ^= i3;
              C2[4] ^= i0;
              C2[5] ^= i1;
              C2[6] ^= i2;
              C2[7] ^= i3;
              for (var i = 0; i < 4; i++) {
                nextState.call(this);
              }
            }
          },
          _doProcessBlock: function(M, offset) {
            var X = this._X;
            nextState.call(this);
            S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
            S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
            S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
            S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
            for (var i = 0; i < 4; i++) {
              S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
              M[offset + i] ^= S[i];
            }
          },
          blockSize: 128 / 32,
          ivSize: 64 / 32
        });
        function nextState() {
          var X = this._X;
          var C2 = this._C;
          for (var i = 0; i < 8; i++) {
            C_[i] = C2[i];
          }
          C2[0] = C2[0] + 1295307597 + this._b | 0;
          C2[1] = C2[1] + 3545052371 + (C2[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
          C2[2] = C2[2] + 886263092 + (C2[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
          C2[3] = C2[3] + 1295307597 + (C2[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
          C2[4] = C2[4] + 3545052371 + (C2[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
          C2[5] = C2[5] + 886263092 + (C2[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
          C2[6] = C2[6] + 1295307597 + (C2[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
          C2[7] = C2[7] + 3545052371 + (C2[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
          this._b = C2[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
          for (var i = 0; i < 8; i++) {
            var gx = X[i] + C2[i];
            var ga = gx & 65535;
            var gb = gx >>> 16;
            var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
            var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
            G[i] = gh ^ gl;
          }
          X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
          X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
          X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
          X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
          X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
          X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
          X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
          X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
        }
        C.Rabbit = StreamCipher._createHelper(Rabbit);
      })();
      return CryptoJS.Rabbit;
    });
  }
});

// node_modules/crypto-js/rabbit-legacy.js
var require_rabbit_legacy = __commonJS({
  "node_modules/crypto-js/rabbit-legacy.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core"], factory);
      } else {
        factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      (function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var StreamCipher = C_lib.StreamCipher;
        var C_algo = C.algo;
        var S = [];
        var C_ = [];
        var G = [];
        var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
          _doReset: function() {
            var K = this._key.words;
            var iv = this.cfg.iv;
            var X = this._X = [
              K[0],
              K[3] << 16 | K[2] >>> 16,
              K[1],
              K[0] << 16 | K[3] >>> 16,
              K[2],
              K[1] << 16 | K[0] >>> 16,
              K[3],
              K[2] << 16 | K[1] >>> 16
            ];
            var C2 = this._C = [
              K[2] << 16 | K[2] >>> 16,
              K[0] & 4294901760 | K[1] & 65535,
              K[3] << 16 | K[3] >>> 16,
              K[1] & 4294901760 | K[2] & 65535,
              K[0] << 16 | K[0] >>> 16,
              K[2] & 4294901760 | K[3] & 65535,
              K[1] << 16 | K[1] >>> 16,
              K[3] & 4294901760 | K[0] & 65535
            ];
            this._b = 0;
            for (var i = 0; i < 4; i++) {
              nextState.call(this);
            }
            for (var i = 0; i < 8; i++) {
              C2[i] ^= X[i + 4 & 7];
            }
            if (iv) {
              var IV = iv.words;
              var IV_0 = IV[0];
              var IV_1 = IV[1];
              var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
              var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
              var i1 = i0 >>> 16 | i2 & 4294901760;
              var i3 = i2 << 16 | i0 & 65535;
              C2[0] ^= i0;
              C2[1] ^= i1;
              C2[2] ^= i2;
              C2[3] ^= i3;
              C2[4] ^= i0;
              C2[5] ^= i1;
              C2[6] ^= i2;
              C2[7] ^= i3;
              for (var i = 0; i < 4; i++) {
                nextState.call(this);
              }
            }
          },
          _doProcessBlock: function(M, offset) {
            var X = this._X;
            nextState.call(this);
            S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
            S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
            S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
            S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
            for (var i = 0; i < 4; i++) {
              S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
              M[offset + i] ^= S[i];
            }
          },
          blockSize: 128 / 32,
          ivSize: 64 / 32
        });
        function nextState() {
          var X = this._X;
          var C2 = this._C;
          for (var i = 0; i < 8; i++) {
            C_[i] = C2[i];
          }
          C2[0] = C2[0] + 1295307597 + this._b | 0;
          C2[1] = C2[1] + 3545052371 + (C2[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
          C2[2] = C2[2] + 886263092 + (C2[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
          C2[3] = C2[3] + 1295307597 + (C2[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
          C2[4] = C2[4] + 3545052371 + (C2[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
          C2[5] = C2[5] + 886263092 + (C2[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
          C2[6] = C2[6] + 1295307597 + (C2[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
          C2[7] = C2[7] + 3545052371 + (C2[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
          this._b = C2[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
          for (var i = 0; i < 8; i++) {
            var gx = X[i] + C2[i];
            var ga = gx & 65535;
            var gb = gx >>> 16;
            var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
            var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
            G[i] = gh ^ gl;
          }
          X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
          X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
          X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
          X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
          X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
          X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
          X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
          X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
        }
        C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
      })();
      return CryptoJS.RabbitLegacy;
    });
  }
});

// node_modules/crypto-js/index.js
var require_crypto_js = __commonJS({
  "node_modules/crypto-js/index.js"(exports, module2) {
    init_shims();
    (function(root, factory, undef) {
      if (typeof exports === "object") {
        module2.exports = exports = factory(require_core(), require_x64_core(), require_lib_typedarrays(), require_enc_utf16(), require_enc_base64(), require_enc_base64url(), require_md5(), require_sha1(), require_sha256(), require_sha224(), require_sha512(), require_sha384(), require_sha3(), require_ripemd160(), require_hmac(), require_pbkdf2(), require_evpkdf(), require_cipher_core(), require_mode_cfb(), require_mode_ctr(), require_mode_ctr_gladman(), require_mode_ofb(), require_mode_ecb(), require_pad_ansix923(), require_pad_iso10126(), require_pad_iso97971(), require_pad_zeropadding(), require_pad_nopadding(), require_format_hex(), require_aes(), require_tripledes(), require_rc4(), require_rabbit(), require_rabbit_legacy());
      } else if (typeof define === "function" && define.amd) {
        define(["./core", "./x64-core", "./lib-typedarrays", "./enc-utf16", "./enc-base64", "./enc-base64url", "./md5", "./sha1", "./sha256", "./sha224", "./sha512", "./sha384", "./sha3", "./ripemd160", "./hmac", "./pbkdf2", "./evpkdf", "./cipher-core", "./mode-cfb", "./mode-ctr", "./mode-ctr-gladman", "./mode-ofb", "./mode-ecb", "./pad-ansix923", "./pad-iso10126", "./pad-iso97971", "./pad-zeropadding", "./pad-nopadding", "./format-hex", "./aes", "./tripledes", "./rc4", "./rabbit", "./rabbit-legacy"], factory);
      } else {
        root.CryptoJS = factory(root.CryptoJS);
      }
    })(exports, function(CryptoJS) {
      return CryptoJS;
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
        const readable2 = new Readable2();
        readable2._read = function() {
        };
        readable2.push(this[BUFFER]);
        readable2.push(null);
        return readable2;
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
    function get2(url, options2) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("GET", url, options2);
      });
    }
    exports.get = get2;
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
    function get2(url, options2, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        return _handleRequest("GET", url, options2, parameters);
      });
    }
    exports.get = get2;
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
var import_crypto_js = __toModule(require_crypto_js());
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
  function update2(fn) {
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
  return { set, update: update2, subscribe: subscribe2 };
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
function is_function(thing) {
  return typeof thing === "function";
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
function get_store_value(store) {
  let value;
  subscribe(store, (_) => value = _)();
  return value;
}
function null_to_empty(value) {
  return value == null ? "" : value;
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
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
var flushing = false;
var seen_callbacks = new Set();
function flush() {
  if (flushing)
    return;
  flushing = true;
  do {
    for (let i = 0; i < dirty_components.length; i += 1) {
      const component = dirty_components[i];
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  flushing = false;
  seen_callbacks.clear();
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
var escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
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
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function add_classes(classes) {
  return classes ? ` class="${classes}"` : "";
}
function afterUpdate() {
}
var css$l = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
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
  $$result.css.add(css$l);
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
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <link rel="icon" href="/logo/Logo1@1x.png" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <link\n      rel="stylesheet"\n      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css"\n    />\n\n    <link\n      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"\n      rel="stylesheet"\n      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"\n      crossorigin="anonymous"\n    />\n    <script\n      src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"\n      integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"\n      crossorigin="anonymous"\n    ><\/script>\n    <link\n      rel="stylesheet"\n      href="https://fonts.googleapis.com/icon?family=Material+Icons"\n    />\n    <link\n      href="https://fonts.googleapis.com/css2?family=Gemunu+Libre"\n      rel="stylesheet"\n    />\n    ' + head + '\n\n    <style>\n      @font-face {\n        font-family: "Thunder Bold";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 700;\n      }\n      @font-face {\n        font-family: "Thunder Medium";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 500;\n      }\n      @font-face {\n        font-family: "Thunder Light";\n        src: url("/font/Thunder-VF.otf") format("opentype");\n        font-weight: 300;\n      }\n      body,\n      html {\n        margin: 0;\n        padding: 0;\n        font-family: "Gemunu Lobre", sans-serif;\n        overflow-x: hidden;\n        background: #212529;\n      }\n      ::-webkit-scrollbar {\n        display: none;\n        width: 0.5rem;\n        scroll-behavior: smooth;\n      }\n    </style>\n  </head>\n  <body class="bg-gray-900">\n    <div id="svelte">' + body + "</div>\n  </body>\n</html>\n";
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
      file: assets + "/_app/start-3229e50e.js",
      css: [assets + "/_app/assets/start-61d1577b.css", assets + "/_app/assets/vendor-15941c5e.css"],
      js: [assets + "/_app/start-3229e50e.js", assets + "/_app/chunks/vendor-0f8d0e6a.js", assets + "/_app/chunks/singletons-12a22614.js"]
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
    root: Root,
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
  assets: [{ "file": "1632011235389.jpg", "size": 4155322, "type": "image/jpeg" }, { "file": "1632011235402.jpg", "size": 4188576, "type": "image/jpeg" }, { "file": "74017-wave-loop.json", "size": 76023, "type": "application/json" }, { "file": "blobBG.svg", "size": 7331, "type": "image/svg+xml" }, { "file": "facebook.svg", "size": 398, "type": "image/svg+xml" }, { "file": "fashion.svg", "size": 8572, "type": "image/svg+xml" }, { "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "font/Thunder-VF.otf", "size": 178752, "type": "font/otf" }, { "file": "font/Thunder-VF.ttf", "size": 103524, "type": "font/ttf" }, { "file": "hero.jpg", "size": 80425, "type": "image/jpeg" }, { "file": "illustrations/undraw_authentication_fsn5.svg", "size": 29406, "type": "image/svg+xml" }, { "file": "illustrations/undraw_begin_chat_c6pj.svg", "size": 23567, "type": "image/svg+xml" }, { "file": "illustrations/undraw_community_8nwl.svg", "size": 20288, "type": "image/svg+xml" }, { "file": "illustrations/undraw_enter_uhqk.svg", "size": 8066, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Live_photo_re_4khn.svg", "size": 6340, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Messaging_fun_re_vic9.svg", "size": 9232, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Online_party_re_7t6g.svg", "size": 13105, "type": "image/svg+xml" }, { "file": "illustrations/undraw_Polaroid_re_481f.svg", "size": 15541, "type": "image/svg+xml" }, { "file": "illustrations/undraw_profile_image_re_ic2f.svg", "size": 7841, "type": "image/svg+xml" }, { "file": "instagram.svg", "size": 1808, "type": "image/svg+xml" }, { "file": "logo/Logo1.svg", "size": 2999, "type": "image/svg+xml" }, { "file": "logo/Logo1@1x.png", "size": 22346, "type": "image/png" }, { "file": "logo/Logo1@2x.png", "size": 46084, "type": "image/png" }, { "file": "person_add_white_48dp.svg", "size": 298, "type": "image/svg+xml" }, { "file": "person_white_48dp.svg", "size": 266, "type": "image/svg+xml" }, { "file": "snapchat.svg", "size": 1478, "type": "image/svg+xml" }, { "file": "tiktok.svg", "size": 707, "type": "image/svg+xml" }, { "file": "twitter.svg", "size": 602, "type": "image/svg+xml" }, { "file": "waiting.svg", "size": 20561, "type": "image/svg+xml" }],
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
      pattern: /^\/posts\/([^/]+?)\/?$/,
      params: (m) => ({ slug: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/posts/[slug].svelte"],
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
    return index$3;
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
    return index$2;
  }),
  "src/routes/admin/dashboard/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/posts/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/posts/[slug].svelte": () => Promise.resolve().then(function() {
    return _slug_;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-18c75d85.js", "css": ["assets/pages/__layout.svelte-843a40be.css", "assets/vendor-15941c5e.css"], "js": ["pages/__layout.svelte-18c75d85.js", "chunks/vendor-0f8d0e6a.js", "chunks/global-2866ba9b.js"], "styles": [] }, "src/routes/__error.svelte": { "entry": "pages/__error.svelte-5fa40c52.js", "css": ["assets/pages/__error.svelte-b104448b.css", "assets/vendor-15941c5e.css"], "js": ["pages/__error.svelte-5fa40c52.js", "chunks/vendor-0f8d0e6a.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-cebaff2c.js", "css": ["assets/pages/index.svelte-97e329c8.css", "assets/vendor-15941c5e.css"], "js": ["pages/index.svelte-cebaff2c.js", "chunks/vendor-0f8d0e6a.js"], "styles": [] }, "src/routes/account.svelte": { "entry": "pages/account.svelte-7af3f05a.js", "css": ["assets/pages/account.svelte-ed2f8ecc.css", "assets/vendor-15941c5e.css"], "js": ["pages/account.svelte-7af3f05a.js", "chunks/vendor-0f8d0e6a.js", "chunks/global-2866ba9b.js"], "styles": [] }, "src/routes/contact.svelte": { "entry": "pages/contact.svelte-5272705b.js", "css": ["assets/pages/contact.svelte-98f3b4c7.css", "assets/vendor-15941c5e.css"], "js": ["pages/contact.svelte-5272705b.js", "chunks/vendor-0f8d0e6a.js"], "styles": [] }, "src/routes/about.svelte": { "entry": "pages/about.svelte-82cdf341.js", "css": ["assets/pages/about.svelte-817f4660.css", "assets/vendor-15941c5e.css"], "js": ["pages/about.svelte-82cdf341.js", "chunks/vendor-0f8d0e6a.js"], "styles": [] }, "src/routes/admin/index.svelte": { "entry": "pages/admin/index.svelte-0281f34a.js", "css": ["assets/pages/admin/index.svelte-2f589472.css", "assets/vendor-15941c5e.css"], "js": ["pages/admin/index.svelte-0281f34a.js", "chunks/vendor-0f8d0e6a.js", "chunks/global-2866ba9b.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js"], "styles": [] }, "src/routes/admin/dashboard/index.svelte": { "entry": "pages/admin/dashboard/index.svelte-325799ab.js", "css": ["assets/pages/admin/dashboard/index.svelte-5b61d014.css", "assets/vendor-15941c5e.css"], "js": ["pages/admin/dashboard/index.svelte-325799ab.js", "chunks/vendor-0f8d0e6a.js", "chunks/navigation-51f4a605.js", "chunks/singletons-12a22614.js", "chunks/global-2866ba9b.js"], "styles": [] }, "src/routes/posts/index.svelte": { "entry": "pages/posts/index.svelte-41ad01b5.js", "css": ["assets/pages/posts/index.svelte-b54c9296.css", "assets/vendor-15941c5e.css"], "js": ["pages/posts/index.svelte-41ad01b5.js", "chunks/vendor-0f8d0e6a.js", "chunks/global-2866ba9b.js"], "styles": [] }, "src/routes/posts/[slug].svelte": { "entry": "pages/posts/[slug].svelte-90bc59cc.js", "css": ["assets/pages/posts/[slug].svelte-1e38b4c6.css", "assets/vendor-15941c5e.css"], "js": ["pages/posts/[slug].svelte-90bc59cc.js", "chunks/vendor-0f8d0e6a.js", "chunks/global-2866ba9b.js"], "styles": [] } };
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
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var subscriber_queue = [];
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
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
  function update2(fn) {
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
  return { set, update: update2, subscribe: subscribe2 };
}
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, (set) => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = () => {
      if (pending) {
        return;
      }
      cleanup();
      const result = fn(single ? values[0] : values, set);
      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };
    const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
      values[i] = value;
      pending &= ~(1 << i);
      if (inited) {
        sync();
      }
    }, () => {
      pending |= 1 << i;
    }));
    inited = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
    };
  });
}
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjAxNTk3OCwiZXhwIjoxOTQ3NTkxOTc4fQ.0T8XLQUmBOidmG8YXoG_FEC8vnKw7_WQGLcJ00LjtNw";
var supabaseURL = "https://sgocnrgwrtdruxnxpxyl.supabase.co";
(0, import_supabase_js.createClient)(supabaseURL, SUPABASE_KEY);
var global_account = writable();
var global_mod_account = writable();
var css$k = {
  code: ".content.svelte-1ymq3wt.svelte-1ymq3wt{width:100000px}.text.svelte-1ymq3wt.svelte-1ymq3wt{animation-name:svelte-1ymq3wt-animation;animation-timing-function:linear;animation-iteration-count:infinite;float:left}.paused.svelte-1ymq3wt .text.svelte-1ymq3wt{animation-play-state:paused}@keyframes svelte-1ymq3wt-animation{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}",
  map: '{"version":3,"file":"MarqueeTextWidget.svelte","sources":["MarqueeTextWidget.svelte"],"sourcesContent":["<script>\\n  import { onMount } from \\"svelte\\";\\n  export let duration = 15;\\n  export let repeat = 2;\\n  export let paused = false;\\n<\/script>\\n\\n<style>\\n  .content {\\n    width: 100000px;\\n  }\\n  .text {\\n    animation-name: animation;\\n    animation-timing-function: linear;\\n    animation-iteration-count: infinite;\\n    float: left;\\n  }\\n  .paused .text {\\n    animation-play-state: paused;\\n  }\\n  @keyframes animation {\\n    0% {\\n      transform: translateX(0);\\n    }\\n    100% {\\n      transform: translateX(-100%);\\n    }\\n  }\\n</style>\\n\\n<div style=\\"overflow: hidden;\\">\\n  <div class=\\"content\\" class:paused={paused === true}>\\n    {#each Array(repeat) as _, i}\\n      <div class=\\"text\\" style=\\"animation-duration: {duration}s\\">\\n        <slot />\\n      </div>\\n    {/each}\\n  </div>\\n</div>\\n"],"names":[],"mappings":"AAQE,QAAQ,8BAAC,CAAC,AACR,KAAK,CAAE,QAAQ,AACjB,CAAC,AACD,KAAK,8BAAC,CAAC,AACL,cAAc,CAAE,wBAAS,CACzB,yBAAyB,CAAE,MAAM,CACjC,yBAAyB,CAAE,QAAQ,CACnC,KAAK,CAAE,IAAI,AACb,CAAC,AACD,sBAAO,CAAC,KAAK,eAAC,CAAC,AACb,oBAAoB,CAAE,MAAM,AAC9B,CAAC,AACD,WAAW,wBAAU,CAAC,AACpB,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,WAAW,CAAC,CAAC,AAC1B,CAAC,AACD,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,WAAW,KAAK,CAAC,AAC9B,CAAC,AACH,CAAC"}'
};
var MarqueeTextWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { duration: duration2 = 15 } = $$props;
  let { repeat = 2 } = $$props;
  let { paused = false } = $$props;
  if ($$props.duration === void 0 && $$bindings.duration && duration2 !== void 0)
    $$bindings.duration(duration2);
  if ($$props.repeat === void 0 && $$bindings.repeat && repeat !== void 0)
    $$bindings.repeat(repeat);
  if ($$props.paused === void 0 && $$bindings.paused && paused !== void 0)
    $$bindings.paused(paused);
  $$result.css.add(css$k);
  return `<div style="${"overflow: hidden;"}"><div class="${["content svelte-1ymq3wt", paused === true ? "paused" : ""].join(" ").trim()}">${each(Array(repeat), (_, i) => `<div class="${"text svelte-1ymq3wt"}" style="${"animation-duration: " + escape2(duration2) + "s"}">${slots.default ? slots.default({}) : ``}
      </div>`)}</div></div>`;
});
var css$j = {
  code: ".menucontainer.svelte-k80em9.svelte-k80em9{position:fixed;top:0;width:100%;height:100px;display:flex;align-items:center;justify-content:space-between;transform-style:preserve-3d;z-index:999}.homeButton.svelte-k80em9.svelte-k80em9{position:relative;text-align:right;width:75px;height:75px;display:flex;justify-content:center;align-items:center;cursor:pointer;user-select:none;font-size:1.5em;margin-left:2em}.homeButton.svelte-k80em9.svelte-k80em9::after{position:absolute;content:'ABIE G';color:white;opacity:0;width:150%;top:50%;transform:translateY(-50%);left:-5%;font-size:1.5em;transition:200ms ease all;z-index:-1}.homeButton.svelte-k80em9.svelte-k80em9:hover::after{left:0%;opacity:0.2}.button.svelte-k80em9.svelte-k80em9{position:relative;width:80px;height:80px;margin-right:20px;margin-left:10px;border-radius:100px;cursor:pointer;z-index:99;transition:200ms ease all;display:flex;justify-content:center;align-items:center;filter:invert(1);user-select:none;transform:rotateX(0deg)}.button-activated.svelte-k80em9.svelte-k80em9{transform:rotateX(-180deg)}.button.svelte-k80em9 .bi.svelte-k80em9{position:absolute;opacity:0;margin:0;padding:0}.button.svelte-k80em9 .icon_activated.svelte-k80em9{opacity:1}.menu.svelte-k80em9.svelte-k80em9{position:fixed;width:100%;height:100%;background:#231942;top:0;right:0;z-index:998;transition:200ms cubic-bezier(0.69, 0.15, 0.86, 0.29) all;color:white;flex-direction:column;transform:translateX(100%);font-family:'XoloniumRegular';opacity:1;overflow:hidden;box-shadow:#323232 0 0 10px}.menu-activated.svelte-k80em9.svelte-k80em9{opacity:1;transform:translateX(0%);transition:500ms cubic-bezier(0, 0.98, 0, 0.98) all}.menu-activated.svelte-k80em9.svelte-k80em9::before{content:'';position:absolute;right:0;top:0;width:100%;height:100%;border:solid white 5em;border-bottom:solid transparent 0;border-right:solid transparent 0;border-top:solid transparent 0;animation:svelte-k80em9-glow 1s cubic-bezier(0.23, 0.93, 0, 1);opacity:0}@keyframes svelte-k80em9-glow{0%{opacity:1}10%{opacity:0.5}100%{opacity:0}}@media screen and (max-width: 800px){.menu.svelte-k80em9.svelte-k80em9{width:100%}}a.svelte-k80em9.svelte-k80em9{text-decoration:none;color:#f7749c;text-align:right}.menu.svelte-k80em9 h1.svelte-k80em9{font-size:5em;text-align:right}.menu__navlinks.svelte-k80em9.svelte-k80em9{display:flex;flex-direction:column;justify-content:center;padding:0;margin-right:50px;margin-top:100px;list-style:none;color:#f7749c;font-family:'Thunder Medium'}@media screen and (max-width: 800px){.menu__navlinks.svelte-k80em9.svelte-k80em9{margin-left:25px}}.menu__navlinks__navlink.svelte-k80em9.svelte-k80em9{position:relative;transition:200ms ease all;cursor:pointer;margin-top:1.5em}.menu__navlinks__navlink.svelte-k80em9 h1.svelte-k80em9{transition:200ms ease all}.menu__navlinks__navlink.svelte-k80em9 span.svelte-k80em9{position:absolute;top:40%;left:-10%;transform:translateY(-50%);width:max-content;font-size:7em;user-select:none;font-family:'Thunder Light';opacity:0;transition:200ms ease all;color:#819ef7;z-index:-1}.menu__navlinks__navlink.svelte-k80em9:hover h1.svelte-k80em9{transform:translateX(-25px)}.menu__navlinks__navlink.svelte-k80em9:hover span.svelte-k80em9{opacity:0.25;left:-15%}.menu__socials.svelte-k80em9.svelte-k80em9{position:absolute;margin-top:100px;display:flex;right:0;width:100%;bottom:10%;justify-content:space-evenly;z-index:3}.marquee2.svelte-k80em9.svelte-k80em9{position:absolute;bottom:-150%;right:0;opacity:0.2;width:200%;user-select:none;font-size:3rem;z-index:1;font-family:'Thunder Bold'}.menu__socials.svelte-k80em9 span.svelte-k80em9{width:50px;height:50px;cursor:pointer;transition:200ms ease all}.menu__socials.svelte-k80em9 span.svelte-k80em9:hover{transform:scale(1.2)}.menu__socials.svelte-k80em9 span.svelte-k80em9:active{transition:none;transform:scale(0.8)}@media screen and (max-width: 800px){.marquee2.svelte-k80em9.svelte-k80em9{width:100%}}",
  map: `{"version":3,"file":"FullscreenNav.svelte","sources":["FullscreenNav.svelte"],"sourcesContent":["<script>\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\timport { global_hasAccount } from '../global';\\r\\n\\timport Marquee from 'svelte-marquee';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\tlet isActivated = false;\\r\\n\\r\\n\\tconst toggleNav = (e) => {\\r\\n\\t\\tif (isActivated) {\\r\\n\\t\\t\\tisActivated = false;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tisActivated = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tconst toggleNavOff = (e) => {\\r\\n\\t\\tif (isActivated) {\\r\\n\\t\\t\\tisActivated = false;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<div class=\\"menucontainer\\">\\r\\n\\t<a href=\\"/\\" class=\\"homeButton\\" on:click={toggleNavOff}> ABIE G </a>\\r\\n\\r\\n\\t<div class={isActivated ? 'button button-activated' : 'button'} on:click={toggleNav}>\\r\\n\\t\\t<i class={!isActivated ? 'bi bi-list icon_activated' : 'bi bi-list'} style=\\"font-size: 3em;\\" />\\r\\n\\t\\t<i class={isActivated ? 'bi bi-x icon_activated' : 'bi bi-list'} style=\\"font-size: 3em;\\" />\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<div class={isActivated ? 'menu menu-activated' : 'menu'}>\\r\\n\\t<ul class=\\"menu__navlinks\\">\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/account\\">\\r\\n\\t\\t\\t\\t<h1>ACCOUNT</h1>\\r\\n\\t\\t\\t\\t<span>\\r\\n\\t\\t\\t\\t\\t<MarqueeTextWidget duration={20}>\\r\\n\\t\\t\\t\\t\\t\\tREGISTER TO GET THE BEST OUT OF THE CONTENT FROM ABIE G &nbsp;\\r\\n\\t\\t\\t\\t\\t</MarqueeTextWidget>\\r\\n\\t\\t\\t\\t</span>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/posts\\">\\r\\n\\t\\t\\t\\t<h1>POSTS</h1>\\r\\n\\t\\t\\t\\t<span>\\r\\n\\t\\t\\t\\t\\t<MarqueeTextWidget duration={20}>\\r\\n\\t\\t\\t\\t\\t\\tCHECK OUT WHAT IS NEW FROM ABIE G HERSELF &nbsp; CHECK OUT WHAT IS NEW FROM ABIE G\\r\\n\\t\\t\\t\\t\\t\\tHERSELF &nbsp;\\r\\n\\t\\t\\t\\t\\t</MarqueeTextWidget>\\r\\n\\t\\t\\t\\t</span>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/about\\">\\r\\n\\t\\t\\t\\t<h1>ABOUT</h1>\\r\\n\\t\\t\\t\\t<span>\\r\\n\\t\\t\\t\\t\\t<MarqueeTextWidget duration={20}>\\r\\n\\t\\t\\t\\t\\t\\tTHIS IS A DESCRIPTION ABOUT THE TEAM CREATED THE SITE &nbsp; THIS IS A DESCRIPTION ABOUT\\r\\n\\t\\t\\t\\t\\t\\tTHE TEAM CREATED THE SITE &nbsp;\\r\\n\\t\\t\\t\\t\\t</MarqueeTextWidget>\\r\\n\\t\\t\\t\\t</span>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t\\t<li class=\\"menu__navlinks__navlink\\" on:click={toggleNav}>\\r\\n\\t\\t\\t<a href=\\"/contact\\">\\r\\n\\t\\t\\t\\t<h1>CONTACT</h1>\\r\\n\\t\\t\\t\\t<span>\\r\\n\\t\\t\\t\\t\\t<MarqueeTextWidget duration={20}>\\r\\n\\t\\t\\t\\t\\t\\tCONNECT WITH THE DEVELOPERS AND CONTENT MODERATORS ABOUT YOUR CONCERNS AND SUGGESTIONS\\r\\n\\t\\t\\t\\t\\t\\t&nbsp;\\r\\n\\t\\t\\t\\t\\t</MarqueeTextWidget>\\r\\n\\t\\t\\t\\t</span>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</li>\\r\\n\\t</ul>\\r\\n\\t<div class=\\"menu__socials\\">\\r\\n\\t\\t<div class=\\"marquee2\\">\\r\\n\\t\\t\\t<MarqueeTextWidget duration={15}>\\r\\n\\t\\t\\t\\tSOCIALIZE WITH ABIE G ON THESE LINKS &nbsp; SOCIALIZE WITH ABIE G ON THESE LINKS &nbsp;\\r\\n\\t\\t\\t\\tSOCIALIZE WITH ABIE G ON THESE LINKS &nbsp;\\r\\n\\t\\t\\t</MarqueeTextWidget>\\r\\n\\t\\t</div>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://facebook.com\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-facebook\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://twitter.com\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-twitter\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://twitch.tv\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-twitch\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://youtube.com\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-youtube\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t\\t<span>\\r\\n\\t\\t\\t<a href=\\"https://instagram.com\\">\\r\\n\\t\\t\\t\\t<i class=\\"bi bi-instagram\\" style=\\"font-size: 3em;\\" />\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t</span>\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.menucontainer {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100px;\\r\\n\\t\\t/* background: black; */\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\ttransform-style: preserve-3d;\\r\\n\\r\\n\\t\\tz-index: 999;\\r\\n\\t}\\r\\n\\t.homeButton {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\ttext-align: right;\\r\\n\\t\\twidth: 75px;\\r\\n\\t\\theight: 75px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tfont-size: 1.5em;\\r\\n\\t\\tmargin-left: 2em;\\r\\n\\t}\\r\\n\\t.homeButton::after {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tcontent: 'ABIE G';\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0;\\r\\n\\t\\twidth: 150%;\\r\\n\\t\\ttop: 50%;\\r\\n\\t\\ttransform: translateY(-50%);\\r\\n\\t\\tleft: -5%;\\r\\n\\t\\tfont-size: 1.5em;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tz-index: -1;\\r\\n\\t}\\r\\n\\t.homeButton:hover::after {\\r\\n\\t\\tleft: 0%;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t}\\r\\n\\t.button {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: 80px;\\r\\n\\t\\theight: 80px;\\r\\n\\t\\tmargin-right: 20px;\\r\\n\\t\\tmargin-left: 10px;\\r\\n\\t\\t/* background: #00212b; */\\r\\n\\t\\tborder-radius: 100px;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tz-index: 99;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tfilter: invert(1);\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\ttransform: rotateX(0deg);\\r\\n\\t}\\r\\n\\t.button-activated {\\r\\n\\t\\ttransform: rotateX(-180deg);\\r\\n\\t}\\r\\n\\t.button .bi {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\topacity: 0;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tpadding: 0;\\r\\n\\t}\\r\\n\\t.button .icon_activated {\\r\\n\\t\\topacity: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.menu {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tbackground: #231942;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tright: 0;\\r\\n\\t\\tz-index: 998;\\r\\n\\t\\t/* clip-path: circle(2rem at calc(100% - 0px) 0px); */\\r\\n\\t\\ttransition: 200ms cubic-bezier(0.69, 0.15, 0.86, 0.29) all;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\ttransform: translateX(100%);\\r\\n\\t\\tfont-family: 'XoloniumRegular';\\r\\n\\t\\topacity: 1;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tbox-shadow: #323232 0 0 10px;\\r\\n\\t}\\r\\n\\t.menu-activated {\\r\\n\\t\\topacity: 1;\\r\\n\\t\\ttransform: translateX(0%);\\r\\n\\t\\ttransition: 500ms cubic-bezier(0, 0.98, 0, 0.98) all;\\r\\n\\t\\t/* clip-path: circle(100vh at calc(100% - 50px) 50px); */\\r\\n\\t}\\r\\n\\t.menu-activated::before {\\r\\n\\t\\tcontent: '';\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tright: 0;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tborder: solid white 5em;\\r\\n\\t\\tborder-bottom: solid transparent 0;\\r\\n\\t\\tborder-right: solid transparent 0;\\r\\n\\t\\tborder-top: solid transparent 0;\\r\\n\\t\\tanimation: glow 1s cubic-bezier(0.23, 0.93, 0, 1);\\r\\n\\t\\topacity: 0;\\r\\n\\t\\t/* z-index: -1; */\\r\\n\\t}\\r\\n\\t@keyframes glow {\\r\\n\\t\\t0% {\\r\\n\\t\\t\\topacity: 1;\\r\\n\\t\\t}\\r\\n\\t\\t10% {\\r\\n\\t\\t\\topacity: 0.5;\\r\\n\\t\\t}\\r\\n\\t\\t100% {\\r\\n\\t\\t\\topacity: 0;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\t@media screen and (max-width: 800px) {\\r\\n\\t\\t.menu {\\r\\n\\t\\t\\twidth: 100%;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\ta {\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: #f7749c;\\r\\n\\t\\ttext-align: right;\\r\\n\\t}\\r\\n\\t.menu h1 {\\r\\n\\t\\tfont-size: 5em;\\r\\n\\t\\ttext-align: right;\\r\\n\\t}\\r\\n\\r\\n\\t.menu__navlinks {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tmargin-right: 50px;\\r\\n\\t\\tmargin-top: 100px;\\r\\n\\t\\tlist-style: none;\\r\\n\\t\\tcolor: #f7749c;\\r\\n\\t\\tfont-family: 'Thunder Medium';\\r\\n\\t}\\r\\n\\r\\n\\t@media screen and (max-width: 800px) {\\r\\n\\t\\t.menu__navlinks {\\r\\n\\t\\t\\tmargin-left: 25px;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\t.menu__navlinks__navlink {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tmargin-top: 1.5em;\\r\\n\\t}\\r\\n\\t.menu__navlinks__navlink h1 {\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t}\\r\\n\\t.menu__navlinks__navlink span {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 40%;\\r\\n\\t\\tleft: -10%;\\r\\n\\t\\ttransform: translateY(-50%);\\r\\n\\t\\twidth: max-content;\\r\\n\\t\\tfont-size: 7em;\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tfont-family: 'Thunder Light';\\r\\n\\t\\topacity: 0;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tcolor: #819ef7;\\r\\n\\t\\tz-index: -1;\\r\\n\\t}\\r\\n\\t.menu__navlinks__navlink:hover h1 {\\r\\n\\t\\ttransform: translateX(-25px);\\r\\n\\t}\\r\\n\\t.menu__navlinks__navlink:hover span {\\r\\n\\t\\topacity: 0.25;\\r\\n\\t\\tleft: -15%;\\r\\n\\t}\\r\\n\\r\\n\\t.menu__socials {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tmargin-top: 100px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tright: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tbottom: 10%;\\r\\n\\t\\tjustify-content: space-evenly;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.marquee2 {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tbottom: -150%;\\r\\n\\t\\tright: 0;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t\\twidth: 200%;\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tfont-size: 3rem;\\r\\n\\t\\tz-index: 1;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t}\\r\\n\\t.menu__socials span {\\r\\n\\t\\twidth: 50px;\\r\\n\\t\\theight: 50px;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t}\\r\\n\\t.menu__socials span:hover {\\r\\n\\t\\ttransform: scale(1.2);\\r\\n\\t}\\r\\n\\t.menu__socials span:active {\\r\\n\\t\\ttransition: none;\\r\\n\\t\\ttransform: scale(0.8);\\r\\n\\t}\\r\\n\\r\\n\\t@media screen and (max-width: 800px) {\\r\\n\\t\\t/* .menu__socials {\\r\\n\\t\\t\\twidth: 100%;\\r\\n\\t\\t}\\r\\n\\t\\t.menu__socials span {\\r\\n\\t\\t\\twidth: 30px;\\r\\n\\t\\t\\theight: 30px;\\r\\n\\t\\t} */\\r\\n\\t\\t.marquee2 {\\r\\n\\t\\t\\twidth: 100%;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAkHC,cAAc,4BAAC,CAAC,AACf,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CAEb,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAC9B,eAAe,CAAE,WAAW,CAE5B,OAAO,CAAE,GAAG,AACb,CAAC,AACD,WAAW,4BAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,OAAO,CACf,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,GAAG,AACjB,CAAC,AACD,uCAAW,OAAO,AAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,QAAQ,CACjB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,CAAC,CACV,KAAK,CAAE,IAAI,CACX,GAAG,CAAE,GAAG,CACR,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,IAAI,CAAE,GAAG,CACT,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,EAAE,AACZ,CAAC,AACD,uCAAW,MAAM,OAAO,AAAC,CAAC,AACzB,IAAI,CAAE,EAAE,CACR,OAAO,CAAE,GAAG,AACb,CAAC,AACD,OAAO,4BAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,IAAI,CAClB,WAAW,CAAE,IAAI,CAEjB,aAAa,CAAE,KAAK,CACpB,MAAM,CAAE,OAAO,CACf,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,OAAO,CAAC,CAAC,CACjB,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,QAAQ,IAAI,CAAC,AACzB,CAAC,AACD,iBAAiB,4BAAC,CAAC,AAClB,SAAS,CAAE,QAAQ,OAAO,CAAC,AAC5B,CAAC,AACD,qBAAO,CAAC,GAAG,cAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,AACX,CAAC,AACD,qBAAO,CAAC,eAAe,cAAC,CAAC,AACxB,OAAO,CAAE,CAAC,AACX,CAAC,AAED,KAAK,4BAAC,CAAC,AACN,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,OAAO,CACnB,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,GAAG,CAEZ,UAAU,CAAE,KAAK,CAAC,aAAa,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,GAAG,CAC1D,KAAK,CAAE,KAAK,CACZ,cAAc,CAAE,MAAM,CACtB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,WAAW,CAAE,iBAAiB,CAC9B,OAAO,CAAE,CAAC,CACV,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,OAAO,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,AAC7B,CAAC,AACD,eAAe,4BAAC,CAAC,AAChB,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,EAAE,CAAC,CACzB,UAAU,CAAE,KAAK,CAAC,aAAa,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,GAAG,AAErD,CAAC,AACD,2CAAe,QAAQ,AAAC,CAAC,AACxB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,CAAC,CACR,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,KAAK,CAAC,KAAK,CAAC,GAAG,CACvB,aAAa,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CAClC,YAAY,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CACjC,UAAU,CAAE,KAAK,CAAC,WAAW,CAAC,CAAC,CAC/B,SAAS,CAAE,kBAAI,CAAC,EAAE,CAAC,aAAa,IAAI,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACjD,OAAO,CAAE,CAAC,AAEX,CAAC,AACD,WAAW,kBAAK,CAAC,AAChB,EAAE,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,AACX,CAAC,AACD,GAAG,AAAC,CAAC,AACJ,OAAO,CAAE,GAAG,AACb,CAAC,AACD,IAAI,AAAC,CAAC,AACL,OAAO,CAAE,CAAC,AACX,CAAC,AACF,CAAC,AACD,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACrC,KAAK,4BAAC,CAAC,AACN,KAAK,CAAE,IAAI,AACZ,CAAC,AACF,CAAC,AACD,CAAC,4BAAC,CAAC,AACF,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,KAAK,AAClB,CAAC,AACD,mBAAK,CAAC,EAAE,cAAC,CAAC,AACT,SAAS,CAAE,GAAG,CACd,UAAU,CAAE,KAAK,AAClB,CAAC,AAED,eAAe,4BAAC,CAAC,AAChB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,CAAC,CACV,YAAY,CAAE,IAAI,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,gBAAgB,AAC9B,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACrC,eAAe,4BAAC,CAAC,AAChB,WAAW,CAAE,IAAI,AAClB,CAAC,AACF,CAAC,AACD,wBAAwB,4BAAC,CAAC,AACzB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,KAAK,AAClB,CAAC,AACD,sCAAwB,CAAC,EAAE,cAAC,CAAC,AAC5B,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,sCAAwB,CAAC,IAAI,cAAC,CAAC,AAC9B,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,IAAI,CACV,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,KAAK,CAAE,WAAW,CAClB,SAAS,CAAE,GAAG,CACd,WAAW,CAAE,IAAI,CACjB,WAAW,CAAE,eAAe,CAC5B,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,KAAK,CAAE,OAAO,CACd,OAAO,CAAE,EAAE,AACZ,CAAC,AACD,sCAAwB,MAAM,CAAC,EAAE,cAAC,CAAC,AAClC,SAAS,CAAE,WAAW,KAAK,CAAC,AAC7B,CAAC,AACD,sCAAwB,MAAM,CAAC,IAAI,cAAC,CAAC,AACpC,OAAO,CAAE,IAAI,CACb,IAAI,CAAE,IAAI,AACX,CAAC,AAED,cAAc,4BAAC,CAAC,AACf,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,CAAC,CACR,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CACX,eAAe,CAAE,YAAY,CAC7B,OAAO,CAAE,CAAC,AACX,CAAC,AACD,SAAS,4BAAC,CAAC,AACV,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,GAAG,CACZ,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,CAAC,CACV,WAAW,CAAE,cAAc,AAC5B,CAAC,AACD,4BAAc,CAAC,IAAI,cAAC,CAAC,AACpB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,4BAAc,CAAC,kBAAI,MAAM,AAAC,CAAC,AAC1B,SAAS,CAAE,MAAM,GAAG,CAAC,AACtB,CAAC,AACD,4BAAc,CAAC,kBAAI,OAAO,AAAC,CAAC,AAC3B,UAAU,CAAE,IAAI,CAChB,SAAS,CAAE,MAAM,GAAG,CAAC,AACtB,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAQrC,SAAS,4BAAC,CAAC,AACV,KAAK,CAAE,IAAI,AACZ,CAAC,AACF,CAAC"}`
};
var FullscreenNav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$j);
  return `<div class="${"menucontainer svelte-k80em9"}"><a href="${"/"}" class="${"homeButton svelte-k80em9"}">ABIE G </a>

	<div class="${escape2(null_to_empty("button")) + " svelte-k80em9"}"><i class="${escape2(null_to_empty("bi bi-list icon_activated")) + " svelte-k80em9"}" style="${"font-size: 3em;"}"></i>
		<i class="${escape2(null_to_empty("bi bi-list")) + " svelte-k80em9"}" style="${"font-size: 3em;"}"></i></div></div>

<div class="${escape2(null_to_empty("menu")) + " svelte-k80em9"}"><ul class="${"menu__navlinks svelte-k80em9"}"><li class="${"menu__navlinks__navlink svelte-k80em9"}"><a href="${"/account"}" class="${"svelte-k80em9"}"><h1 class="${"svelte-k80em9"}">ACCOUNT</h1>
				<span class="${"svelte-k80em9"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 20 }, {}, {
    default: () => `REGISTER TO GET THE BEST OUT OF THE CONTENT FROM ABIE G \xA0
					`
  })}</span></a></li>
		<li class="${"menu__navlinks__navlink svelte-k80em9"}"><a href="${"/posts"}" class="${"svelte-k80em9"}"><h1 class="${"svelte-k80em9"}">POSTS</h1>
				<span class="${"svelte-k80em9"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 20 }, {}, {
    default: () => `CHECK OUT WHAT IS NEW FROM ABIE G HERSELF \xA0 CHECK OUT WHAT IS NEW FROM ABIE G
						HERSELF \xA0
					`
  })}</span></a></li>
		<li class="${"menu__navlinks__navlink svelte-k80em9"}"><a href="${"/about"}" class="${"svelte-k80em9"}"><h1 class="${"svelte-k80em9"}">ABOUT</h1>
				<span class="${"svelte-k80em9"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 20 }, {}, {
    default: () => `THIS IS A DESCRIPTION ABOUT THE TEAM CREATED THE SITE \xA0 THIS IS A DESCRIPTION ABOUT
						THE TEAM CREATED THE SITE \xA0
					`
  })}</span></a></li>
		<li class="${"menu__navlinks__navlink svelte-k80em9"}"><a href="${"/contact"}" class="${"svelte-k80em9"}"><h1 class="${"svelte-k80em9"}">CONTACT</h1>
				<span class="${"svelte-k80em9"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 20 }, {}, {
    default: () => `CONNECT WITH THE DEVELOPERS AND CONTENT MODERATORS ABOUT YOUR CONCERNS AND SUGGESTIONS
						\xA0
					`
  })}</span></a></li></ul>
	<div class="${"menu__socials svelte-k80em9"}"><div class="${"marquee2 svelte-k80em9"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `SOCIALIZE WITH ABIE G ON THESE LINKS \xA0 SOCIALIZE WITH ABIE G ON THESE LINKS \xA0
				SOCIALIZE WITH ABIE G ON THESE LINKS \xA0
			`
  })}</div>
		<span class="${"svelte-k80em9"}"><a href="${"https://facebook.com"}" class="${"svelte-k80em9"}"><i class="${"bi bi-facebook"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-k80em9"}"><a href="${"https://twitter.com"}" class="${"svelte-k80em9"}"><i class="${"bi bi-twitter"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-k80em9"}"><a href="${"https://twitch.tv"}" class="${"svelte-k80em9"}"><i class="${"bi bi-twitch"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-k80em9"}"><a href="${"https://youtube.com"}" class="${"svelte-k80em9"}"><i class="${"bi bi-youtube"}" style="${"font-size: 3em;"}"></i></a></span>
		<span class="${"svelte-k80em9"}"><a href="${"https://instagram.com"}" class="${"svelte-k80em9"}"><i class="${"bi bi-instagram"}" style="${"font-size: 3em;"}"></i></a></span></div>
</div>`;
});
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `

<div class="${"text-white py-5 shadow bg-grey-900"}"><div class="${"container"}"><div class="${"row"}"><div class="${"col-sm-12"}"><h4>Abie G</h4></div>
			<div class="${"col-sm-12"}"><a class="${"link-light me-2"}" href="${"facebook.com"}"><i class="${"bi bi-facebook"}"></i></a>
				<a class="${"link-light me-2"}" href="${"twitch.tv"}"><i class="${"bi bi-twitch"}"></i></a>
				<a class="${"link-light me-2"}" href="${"twitter.com"}"><i class="${"bi bi-twitter"}"></i></a>
				<a class="${"link-light me-2"}" href="${"instagram.com"}"><i class="${"bi bi-instagram"}"></i></a></div>
			<div class="${"col-sm-12"}"><p>\xA9 2021</p></div></div></div>
</div>`;
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let mainContainer;
  return `${validate_component(FullscreenNav, "FullscreenNav").$$render($$result, {}, {}, {})}
<main${add_attribute("this", mainContainer, 0)}></main>
${slots.default ? slots.default({}) : ``}
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
`;
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
function cubicInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 0.5 * Math.pow(2 * t - 2, 3) + 1;
}
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function __rest(s2, e) {
  var t = {};
  for (var p in s2)
    if (Object.prototype.hasOwnProperty.call(s2, p) && e.indexOf(p) < 0)
      t[p] = s2[p];
  if (s2 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s2); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s2, p[i]))
        t[p[i]] = s2[p[i]];
    }
  return t;
}
function crossfade(_a) {
  var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
  const to_receive = new Map();
  const to_send = new Map();
  function crossfade2(from, node, params) {
    const { delay = 0, duration: duration2 = (d3) => Math.sqrt(d3) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
    const to = node.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const dw = from.width / to.width;
    const dh = from.height / to.height;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;
    const opacity = +style.opacity;
    return {
      delay,
      duration: is_function(duration2) ? duration2(d2) : duration2,
      easing,
      css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
    };
  }
  function transition(items, counterparts, intro) {
    return (node, params) => {
      items.set(params.key, {
        rect: node.getBoundingClientRect()
      });
      return () => {
        if (counterparts.has(params.key)) {
          const { rect } = counterparts.get(params.key);
          counterparts.delete(params.key);
          return crossfade2(rect, node, params);
        }
        items.delete(params.key);
        return fallback && fallback(node, params, intro);
      };
    };
  }
  return [
    transition(to_send, to_receive, false),
    transition(to_receive, to_send, true)
  ];
}
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
  code: ".loading.svelte-ydpr8h.svelte-ydpr8h{position:fixed}.floatingImage.svelte-ydpr8h.svelte-ydpr8h{position:fixed;width:50vw;height:100vh;right:0;display:flex;justify-content:center;align-items:center;transition:200ms ease opacity}.floatingImage.svelte-ydpr8h img.svelte-ydpr8h{width:100%;height:100%;opacity:0.5;object-fit:cover;clip-path:polygon(5% 0%, 100% 0%, 100% 100%, 5% 100%);transition:500ms ease all}.joinbutton.svelte-ydpr8h.svelte-ydpr8h{padding:1em;width:60%;margin-top:50px;font-size:1rem;background:none;border-radius:100px;color:white;border:#f88dad solid 0.2rem;cursor:pointer;font-weight:700;transition:200ms ease all}.joinbutton.svelte-ydpr8h.svelte-ydpr8h:hover{color:white;background:#f88dad;border:#f88dad solid 0.2rem;transform:scale(1.1)}.logo.svelte-ydpr8h.svelte-ydpr8h{position:fixed;opacity:0.1;width:1000px;top:calc(7 0% - 500px);right:calc(5% - 300px);z-index:-1}.hero.svelte-ydpr8h.svelte-ydpr8h{min-height:100vh;overflow:hidden;z-index:3}main.svelte-ydpr8h.svelte-ydpr8h{transition:500ms ease all}main.svelte-ydpr8h .svelte-ydpr8h{user-select:none}.brand.svelte-ydpr8h.svelte-ydpr8h{position:absolute;bottom:25%;left:25px;opacity:0.4}.brand2.svelte-ydpr8h.svelte-ydpr8h{opacity:0.3}.brand3.svelte-ydpr8h.svelte-ydpr8h{opacity:0.2}.brand4.svelte-ydpr8h.svelte-ydpr8h{opacity:0.1}.brand__letterContainer.svelte-ydpr8h.svelte-ydpr8h{width:100%;height:150px;display:flex}.brand__letterContainer.svelte-ydpr8h .brand__lc_letter.svelte-ydpr8h{font-weight:600;font-family:'Montserrat', sans-serif;font-size:8rem;width:125px;height:125px;opacity:0.5;color:transparent;display:flex;justify-content:center;align-items:center;color:transparent;-webkit-text-stroke-width:1px;-webkit-text-stroke-color:white;transition:opacity 200ms ease}.letter-g.svelte-ydpr8h.svelte-ydpr8h{margin-left:25px}.content.svelte-ydpr8h.svelte-ydpr8h{position:absolute;right:5%;bottom:10%;color:white;text-align:right}.scrollDown.svelte-ydpr8h.svelte-ydpr8h{position:fixed;top:50%;right:5%;width:5px;height:5px;border:white 10px solid;border-radius:100px;animation:svelte-ydpr8h-scrolldown 1s ease infinite;z-index:3}@keyframes svelte-ydpr8h-scrolldown{0%{opacity:0;transform:translateY(20px)}20%{opacity:1}60%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}@media screen and (max-width: 800px){.floatingImage.svelte-ydpr8h.svelte-ydpr8h{width:100vw}.content.svelte-ydpr8h.svelte-ydpr8h{right:5%;max-width:75%}.content.svelte-ydpr8h .textEffectContainer.svelte-ydpr8h{display:flex;align-items:center}.joinbutton.svelte-ydpr8h.svelte-ydpr8h{width:100%}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\n\\timport { onMount } from 'svelte';\\n\\timport IntersectionObserver from 'svelte-intersection-observer';\\n\\n\\tlet windowScrollY, loading, mainContainer, floatingImage;\\n\\n\\t// console.log(windowScrollY);\\n\\n\\tonMount((e) => {\\n\\t\\twindow.onscroll = (e) => {\\n\\t\\t\\tconsole.log(windowScrollY);\\n\\t\\t};\\n\\t});\\n\\n\\tlet hero1;\\n\\tlet hero2;\\n\\tlet hero3;\\n\\tlet isHero1Intersecting;\\n\\tlet isHero2Intersecting;\\n\\tlet isHero3Intersecting;\\n<\/script>\\n\\n<svelte:window bind:scrollY={windowScrollY} />\\n<!-- <svelte:body bind:offsetHeight={documentHeight} /> -->\\n\\n<div class=\\"loading\\" bind:this={loading}>\\n\\t<div class=\\"loadingBar\\" />\\n</div>\\n<p class=\\"scrollDown\\" />\\n\\n<!-- <div class=\\"background\\" /> -->\\n<main bind:this={mainContainer} class=\\"hero\\">\\n\\t<div\\n\\t\\tclass=\\"floatingImage\\"\\n\\t\\tstyle=\\"\\n\\t\\t\\ttransform: translateX({Math.min((windowScrollY / 500) * 30, 60)}%);\\n\\t\\t\\topacity: {windowScrollY > 200 ? 0 : 1};\\n\\t\\t\\"\\n\\t>\\n\\t\\t<img bind:this={floatingImage} src=\\"./hero.jpg\\" alt=\\"\\" />\\n\\t</div>\\n\\t<img\\n\\t\\tclass=\\"logo\\"\\n\\t\\tsrc=\\"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/Logo1@1x.png\\"\\n\\t\\talt=\\"\\"\\n\\t\\ttransition:fade|local={{ delay: 200, duration: 200 }}\\n\\t/>\\n\\t<div class=\\"brand\\" style=\\"transform: translateY(-{Math.min((windowScrollY / 20) * 5, 300)}%);\\">\\n\\t\\t<div class=\\"brand__letterContainer\\">\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">A</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">B</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">I</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">E</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter letter-g\\">G</span>\\n\\t\\t</div>\\n\\t</div>\\n\\t<div\\n\\t\\tclass=\\"brand brand2\\"\\n\\t\\tstyle=\\"transform: translateY(-{Math.min((windowScrollY / 20) * 7, 300)}%);\\"\\n\\t>\\n\\t\\t<div class=\\"brand__letterContainer\\">\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">A</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">B</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">I</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">E</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter letter-g\\">G</span>\\n\\t\\t</div>\\n\\t</div>\\n\\t<div\\n\\t\\tclass=\\"brand brand3\\"\\n\\t\\tstyle=\\"transform: translateY(-{Math.min((windowScrollY / 20) * 9, 300)}%);\\"\\n\\t>\\n\\t\\t<div class=\\"brand__letterContainer\\">\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">A</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">B</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">I</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">E</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter letter-g\\">G</span>\\n\\t\\t</div>\\n\\t</div>\\n\\t<div\\n\\t\\tclass=\\"brand brand4\\"\\n\\t\\tstyle=\\"transform: translateY(-{Math.min((windowScrollY / 20) * 11, 300)}%);\\"\\n\\t>\\n\\t\\t<div class=\\"brand__letterContainer\\">\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">A</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">B</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">I</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter\\">E</span>\\n\\t\\t\\t<span class=\\"brand__lc_letter letter-g\\">G</span>\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t<div class=\\"content\\">\\n\\t\\t<p>Register and get the best out of it</p>\\n\\t\\t<!-- <p>{height}</p> -->\\n\\t\\t<h4 class=\\"textEffectContainer display-6\\">Join us with Abie G to VIRTUALIZE the world</h4>\\n\\t\\t<a href=\\"/account\\">\\n\\t\\t\\t<button class=\\"joinbutton\\"> Register Now </button>\\n\\t\\t</a>\\n\\t</div>\\n\\t<!-- <div bind:this={rec1} class=\\"brand__candy_rec1\\" />\\n\\t<div bind:this={rec2} class=\\"brand__candy_rec2\\" /> -->\\n</main>\\n<IntersectionObserver threshold={0.2} element={hero1} bind:intersecting={isHero1Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero1}\\n\\t\\tstyle={isHero1Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(-10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white my-5 py-5\\"\\n\\t>\\n\\t\\t<div class=\\"container text-center\\">\\n\\t\\t\\t<img class=\\"mb-5\\" src=\\"./illustrations/undraw_Online_party_re_7t6g.svg\\" width=\\"350\\" alt=\\"\\" />\\n\\t\\t\\t<h1 class=\\"display-3\\">ABIE G WEBSITE IS NOW LIVE!!!</h1>\\n\\t\\t\\t<p>\\n\\t\\t\\t\\tIn celebration for hitting the two-million [!!!] follower mark on each of her social media\\n\\t\\t\\t\\taccounts, AbieG formally welcomes you (yes, you!) to her namesake website\u2019s ribbon-cutting\\n\\t\\t\\t\\tceremony. Fancy.\\n\\t\\t\\t</p>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n<IntersectionObserver threshold={0.2} element={hero2} bind:intersecting={isHero2Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero2}\\n\\t\\tstyle={isHero2Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white  my-5 py-5\\"\\n\\t>\\n\\t\\t<div class=\\"container text-center\\">\\n\\t\\t\\t<img class=\\"mb-5\\" src=\\"./illustrations/undraw_community_8nwl.svg\\" width=\\"350\\" alt=\\"\\" />\\n\\t\\t\\t<h1 class=\\"display-3\\">Abie G Community Moderators</h1>\\n\\t\\t\\t<p>\\n\\t\\t\\t\\tTo ensure a safe space for the community members, this site is regularly kept in check by\\n\\t\\t\\t\\tthe moderators. Inappropriate conducts are strictly discouraged and violation to community\\n\\t\\t\\t\\trules may result to account suspension and/or removal.\\n\\t\\t\\t</p>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n<IntersectionObserver threshold={0.2} element={hero3} bind:intersecting={isHero3Intersecting}>\\n\\t<main\\n\\t\\tbind:this={hero3}\\n\\t\\tstyle={isHero3Intersecting\\n\\t\\t\\t? 'transform: translateX(0); opacity: 1'\\n\\t\\t\\t: 'transform: translateX(-10%); opacity: 0;'}\\n\\t\\tclass=\\"d-flex align-items-center text-white my-5 py-5\\"\\n\\t>\\n\\t\\t<div class=\\"container text-center\\">\\n\\t\\t\\t<img class=\\"mb-5\\" src=\\"./illustrations/undraw_begin_chat_c6pj.svg\\" width=\\"350\\" alt=\\"\\" />\\n\\t\\t\\t<h1 class=\\"display-3\\">Connect with Abie G with exclusive content</h1>\\n\\t\\t\\t<p>\\n\\t\\t\\t\\tThis site takes BabieGs to a much more intimate interaction with AbieG herself as she shares\\n\\t\\t\\t\\twith them glimpses of her everyday life, ambitions, and aspirations as well as\\n\\t\\t\\t\\tsite-exclusive giveaways and surprises.\\n\\t\\t\\t</p>\\n\\t\\t</div>\\n\\t</main>\\n</IntersectionObserver>\\n\\n<!-- for maintenance -->\\n<!-- <main style=\\"display: flex; align-items:center;\\">\\n\\t<div class=\\"container white-text\\">\\n\\t\\t<h1>Sorry, we are fixing or updating something</h1>\\n\\t\\t<p>Please come back in some time</p>\\n\\t</div>\\n</main> -->\\n\\n<svelte:head>\\n\\t<link rel=\\"preconnect\\" href=\\"https://fonts.googleapis.com\\" />\\n\\t<link rel=\\"preconnect\\" href=\\"https://fonts.gstatic.com\\" crossorigin />\\n</svelte:head>\\n\\n<style>\\n\\t.loading {\\n\\t\\tposition: fixed;\\n\\t}\\n\\t.floatingImage {\\n\\t\\tposition: fixed;\\n\\t\\twidth: 50vw;\\n\\t\\theight: 100vh;\\n\\t\\tright: 0;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\ttransition: 200ms ease opacity;\\n\\t}\\n\\t.floatingImage img {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\n\\t\\topacity: 0.5;\\n\\t\\tobject-fit: cover;\\n\\t\\tclip-path: polygon(5% 0%, 100% 0%, 100% 100%, 5% 100%);\\n\\t\\ttransition: 500ms ease all;\\n\\t}\\n\\t.joinbutton {\\n\\t\\tpadding: 1em;\\n\\t\\twidth: 60%;\\n\\t\\tmargin-top: 50px;\\n\\t\\tfont-size: 1rem;\\n\\t\\tbackground: none;\\n\\t\\tborder-radius: 100px;\\n\\t\\tcolor: white;\\n\\t\\tborder: #f88dad solid 0.2rem;\\n\\t\\tcursor: pointer;\\n\\t\\tfont-weight: 700;\\n\\t\\ttransition: 200ms ease all;\\n\\t}\\n\\t.joinbutton:hover {\\n\\t\\tcolor: white;\\n\\t\\tbackground: #f88dad;\\n\\t\\tborder: #f88dad solid 0.2rem;\\n\\t\\ttransform: scale(1.1);\\n\\t}\\n\\t.logo {\\n\\t\\tposition: fixed;\\n\\t\\topacity: 0.1;\\n\\t\\twidth: 1000px;\\n\\t\\ttop: calc(7 0% - 500px);\\n\\t\\tright: calc(5% - 300px);\\n\\t\\tz-index: -1;\\n\\t}\\n\\n\\t.hero {\\n\\t\\t/* margin: 0; */\\n\\t\\tmin-height: 100vh;\\n\\t\\toverflow: hidden;\\n\\t\\tz-index: 3;\\n\\t}\\n\\tmain {\\n\\t\\ttransition: 500ms ease all;\\n\\t}\\n\\tmain * {\\n\\t\\t/* margin: 0; */\\n\\t\\tuser-select: none;\\n\\t}\\n\\t.brand {\\n\\t\\tposition: absolute;\\n\\t\\tbottom: 25%;\\n\\t\\tleft: 25px;\\n\\t\\topacity: 0.4;\\n\\t}\\n\\t.brand2 {\\n\\t\\topacity: 0.3;\\n\\t}\\n\\t.brand3 {\\n\\t\\topacity: 0.2;\\n\\t}\\n\\t.brand4 {\\n\\t\\topacity: 0.1;\\n\\t}\\n\\t.brand__letterContainer {\\n\\t\\twidth: 100%;\\n\\t\\theight: 150px;\\n\\t\\tdisplay: flex;\\n\\t\\t/* justify-content: flex-start; */\\n\\t\\t/* align-items: center; */\\n\\t}\\n\\n\\t.brand__letterContainer .brand__lc_letter {\\n\\t\\tfont-weight: 600;\\n\\t\\tfont-family: 'Montserrat', sans-serif;\\n\\t\\tfont-size: 8rem;\\n\\t\\twidth: 125px;\\n\\t\\theight: 125px;\\n\\t\\topacity: 0.5;\\n\\t\\tcolor: transparent;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tcolor: transparent;\\n\\t\\t-webkit-text-stroke-width: 1px;\\n\\t\\t-webkit-text-stroke-color: white;\\n\\t\\ttransition: opacity 200ms ease;\\n\\t}\\n\\t.letter-g {\\n\\t\\tmargin-left: 25px;\\n\\t}\\n\\t.content {\\n\\t\\tposition: absolute;\\n\\t\\tright: 5%;\\n\\t\\tbottom: 10%;\\n\\t\\tcolor: white;\\n\\t\\ttext-align: right;\\n\\t}\\n\\t.scrollDown {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 50%;\\n\\t\\tright: 5%;\\n\\t\\twidth: 5px;\\n\\t\\theight: 5px;\\n\\t\\tborder: white 10px solid;\\n\\t\\tborder-radius: 100px;\\n\\t\\tanimation: scrolldown 1s ease infinite;\\n\\t\\tz-index: 3;\\n\\t}\\n\\t@keyframes scrolldown {\\n\\t\\t0% {\\n\\t\\t\\topacity: 0;\\n\\t\\t\\ttransform: translateY(20px);\\n\\t\\t}\\n\\t\\t20% {\\n\\t\\t\\topacity: 1;\\n\\t\\t\\t/* transform: rotate(-45deg) translate(10px, -10px); */\\n\\t\\t}\\n\\t\\t60% {\\n\\t\\t\\topacity: 1;\\n\\t\\t\\t/* transform: rotate(-45deg) translate(10px, -10px); */\\n\\t\\t}\\n\\t\\t100% {\\n\\t\\t\\topacity: 0;\\n\\t\\t\\ttransform: translateY(-20px);\\n\\t\\t}\\n\\t}\\n\\t@media screen and (max-width: 800px) {\\n\\t\\t.floatingImage {\\n\\t\\t\\twidth: 100vw;\\n\\t\\t}\\n\\t\\t.content {\\n\\t\\t\\tright: 5%;\\n\\t\\t\\tmax-width: 75%;\\n\\t\\t}\\n\\t\\t.content .textEffectContainer {\\n\\t\\t\\tdisplay: flex;\\n\\t\\t\\talign-items: center;\\n\\t\\t}\\n\\t\\t.joinbutton {\\n\\t\\t\\twidth: 100%;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAiLC,QAAQ,4BAAC,CAAC,AACT,QAAQ,CAAE,KAAK,AAChB,CAAC,AACD,cAAc,4BAAC,CAAC,AACf,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,OAAO,AAC/B,CAAC,AACD,4BAAc,CAAC,GAAG,cAAC,CAAC,AACnB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAEZ,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,KAAK,CACjB,SAAS,CAAE,QAAQ,EAAE,CAAC,EAAE,CAAC,CAAC,IAAI,CAAC,EAAE,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,EAAE,CAAC,IAAI,CAAC,CACtD,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,WAAW,4BAAC,CAAC,AACZ,OAAO,CAAE,GAAG,CACZ,KAAK,CAAE,GAAG,CACV,UAAU,CAAE,IAAI,CAChB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,IAAI,CAChB,aAAa,CAAE,KAAK,CACpB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,OAAO,CAAC,KAAK,CAAC,MAAM,CAC5B,MAAM,CAAE,OAAO,CACf,WAAW,CAAE,GAAG,CAChB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,uCAAW,MAAM,AAAC,CAAC,AAClB,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,OAAO,CAAC,KAAK,CAAC,MAAM,CAC5B,SAAS,CAAE,MAAM,GAAG,CAAC,AACtB,CAAC,AACD,KAAK,4BAAC,CAAC,AACN,QAAQ,CAAE,KAAK,CACf,OAAO,CAAE,GAAG,CACZ,KAAK,CAAE,MAAM,CACb,GAAG,CAAE,KAAK,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,KAAK,CAAC,CACvB,KAAK,CAAE,KAAK,EAAE,CAAC,CAAC,CAAC,KAAK,CAAC,CACvB,OAAO,CAAE,EAAE,AACZ,CAAC,AAED,KAAK,4BAAC,CAAC,AAEN,UAAU,CAAE,KAAK,CACjB,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,IAAI,4BAAC,CAAC,AACL,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,kBAAI,CAAC,cAAE,CAAC,AAEP,WAAW,CAAE,IAAI,AAClB,CAAC,AACD,MAAM,4BAAC,CAAC,AACP,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,OAAO,CAAE,GAAG,AACb,CAAC,AACD,OAAO,4BAAC,CAAC,AACR,OAAO,CAAE,GAAG,AACb,CAAC,AACD,OAAO,4BAAC,CAAC,AACR,OAAO,CAAE,GAAG,AACb,CAAC,AACD,OAAO,4BAAC,CAAC,AACR,OAAO,CAAE,GAAG,AACb,CAAC,AACD,uBAAuB,4BAAC,CAAC,AACxB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IAAI,AAGd,CAAC,AAED,qCAAuB,CAAC,iBAAiB,cAAC,CAAC,AAC1C,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,YAAY,CAAC,CAAC,UAAU,CACrC,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,GAAG,CACZ,KAAK,CAAE,WAAW,CAClB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,WAAW,CAClB,yBAAyB,CAAE,GAAG,CAC9B,yBAAyB,CAAE,KAAK,CAChC,UAAU,CAAE,OAAO,CAAC,KAAK,CAAC,IAAI,AAC/B,CAAC,AACD,SAAS,4BAAC,CAAC,AACV,WAAW,CAAE,IAAI,AAClB,CAAC,AACD,QAAQ,4BAAC,CAAC,AACT,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,EAAE,CACT,MAAM,CAAE,GAAG,CACX,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,KAAK,AAClB,CAAC,AACD,WAAW,4BAAC,CAAC,AACZ,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,EAAE,CACT,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,CACX,MAAM,CAAE,KAAK,CAAC,IAAI,CAAC,KAAK,CACxB,aAAa,CAAE,KAAK,CACpB,SAAS,CAAE,wBAAU,CAAC,EAAE,CAAC,IAAI,CAAC,QAAQ,CACtC,OAAO,CAAE,CAAC,AACX,CAAC,AACD,WAAW,wBAAW,CAAC,AACtB,EAAE,AAAC,CAAC,AACH,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,IAAI,CAAC,AAC5B,CAAC,AACD,GAAG,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,AAEX,CAAC,AACD,GAAG,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,AAEX,CAAC,AACD,IAAI,AAAC,CAAC,AACL,OAAO,CAAE,CAAC,CACV,SAAS,CAAE,WAAW,KAAK,CAAC,AAC7B,CAAC,AACF,CAAC,AACD,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACrC,cAAc,4BAAC,CAAC,AACf,KAAK,CAAE,KAAK,AACb,CAAC,AACD,QAAQ,4BAAC,CAAC,AACT,KAAK,CAAE,EAAE,CACT,SAAS,CAAE,GAAG,AACf,CAAC,AACD,sBAAQ,CAAC,oBAAoB,cAAC,CAAC,AAC9B,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,AACpB,CAAC,AACD,WAAW,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,AACZ,CAAC,AACF,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let windowScrollY, loading, mainContainer, floatingImage;
  let hero1;
  let hero2;
  let hero3;
  let isHero1Intersecting;
  let isHero2Intersecting;
  let isHero3Intersecting;
  $$result.css.add(css$h);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `


<div class="${"loading svelte-ydpr8h"}"${add_attribute("this", loading, 0)}><div class="${"loadingBar"}"></div></div>
<p class="${"scrollDown svelte-ydpr8h"}"></p>


<main class="${"hero svelte-ydpr8h"}"${add_attribute("this", mainContainer, 0)}><div class="${"floatingImage svelte-ydpr8h"}" style="${"transform: translateX(" + escape2(Math.min(windowScrollY / 500 * 30, 60)) + "%); opacity: " + escape2(1) + ";"}"><img src="${"./hero.jpg"}" alt="${""}" class="${"svelte-ydpr8h"}"${add_attribute("this", floatingImage, 0)}></div>
	<img class="${"logo svelte-ydpr8h"}" src="${"https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/Logo1@1x.png"}" alt="${""}">
	<div class="${"brand svelte-ydpr8h"}" style="${"transform: translateY(-" + escape2(Math.min(windowScrollY / 20 * 5, 300)) + "%);"}"><div class="${"brand__letterContainer svelte-ydpr8h"}"><span class="${"brand__lc_letter svelte-ydpr8h"}">A</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">B</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">I</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">E</span>
			<span class="${"brand__lc_letter letter-g svelte-ydpr8h"}">G</span></div></div>
	<div class="${"brand brand2 svelte-ydpr8h"}" style="${"transform: translateY(-" + escape2(Math.min(windowScrollY / 20 * 7, 300)) + "%);"}"><div class="${"brand__letterContainer svelte-ydpr8h"}"><span class="${"brand__lc_letter svelte-ydpr8h"}">A</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">B</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">I</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">E</span>
			<span class="${"brand__lc_letter letter-g svelte-ydpr8h"}">G</span></div></div>
	<div class="${"brand brand3 svelte-ydpr8h"}" style="${"transform: translateY(-" + escape2(Math.min(windowScrollY / 20 * 9, 300)) + "%);"}"><div class="${"brand__letterContainer svelte-ydpr8h"}"><span class="${"brand__lc_letter svelte-ydpr8h"}">A</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">B</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">I</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">E</span>
			<span class="${"brand__lc_letter letter-g svelte-ydpr8h"}">G</span></div></div>
	<div class="${"brand brand4 svelte-ydpr8h"}" style="${"transform: translateY(-" + escape2(Math.min(windowScrollY / 20 * 11, 300)) + "%);"}"><div class="${"brand__letterContainer svelte-ydpr8h"}"><span class="${"brand__lc_letter svelte-ydpr8h"}">A</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">B</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">I</span>
			<span class="${"brand__lc_letter svelte-ydpr8h"}">E</span>
			<span class="${"brand__lc_letter letter-g svelte-ydpr8h"}">G</span></div></div>

	<div class="${"content svelte-ydpr8h"}"><p class="${"svelte-ydpr8h"}">Register and get the best out of it</p>
		
		<h4 class="${"textEffectContainer display-6 svelte-ydpr8h"}">Join us with Abie G to VIRTUALIZE the world</h4>
		<a href="${"/account"}" class="${"svelte-ydpr8h"}"><button class="${"joinbutton svelte-ydpr8h"}">Register Now </button></a></div>
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
      default: () => `<main${add_attribute("style", isHero1Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(-10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 py-5 svelte-ydpr8h"}"${add_attribute("this", hero1, 0)}><div class="${"container text-center svelte-ydpr8h"}"><img class="${"mb-5 svelte-ydpr8h"}" src="${"./illustrations/undraw_Online_party_re_7t6g.svg"}" width="${"350"}" alt="${""}">
			<h1 class="${"display-3 svelte-ydpr8h"}">ABIE G WEBSITE IS NOW LIVE!!!</h1>
			<p class="${"svelte-ydpr8h"}">In celebration for hitting the two-million [!!!] follower mark on each of her social media
				accounts, AbieG formally welcomes you (yes, you!) to her namesake website\u2019s ribbon-cutting
				ceremony. Fancy.
			</p></div></main>`
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
      default: () => `<main${add_attribute("style", isHero2Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 py-5 svelte-ydpr8h"}"${add_attribute("this", hero2, 0)}><div class="${"container text-center svelte-ydpr8h"}"><img class="${"mb-5 svelte-ydpr8h"}" src="${"./illustrations/undraw_community_8nwl.svg"}" width="${"350"}" alt="${""}">
			<h1 class="${"display-3 svelte-ydpr8h"}">Abie G Community Moderators</h1>
			<p class="${"svelte-ydpr8h"}">To ensure a safe space for the community members, this site is regularly kept in check by
				the moderators. Inappropriate conducts are strictly discouraged and violation to community
				rules may result to account suspension and/or removal.
			</p></div></main>`
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
      default: () => `<main${add_attribute("style", isHero3Intersecting ? "transform: translateX(0); opacity: 1" : "transform: translateX(-10%); opacity: 0;", 0)} class="${"d-flex align-items-center text-white my-5 py-5 svelte-ydpr8h"}"${add_attribute("this", hero3, 0)}><div class="${"container text-center svelte-ydpr8h"}"><img class="${"mb-5 svelte-ydpr8h"}" src="${"./illustrations/undraw_begin_chat_c6pj.svg"}" width="${"350"}" alt="${""}">
			<h1 class="${"display-3 svelte-ydpr8h"}">Connect with Abie G with exclusive content</h1>
			<p class="${"svelte-ydpr8h"}">This site takes BabieGs to a much more intimate interaction with AbieG herself as she shares
				with them glimpses of her everyday life, ambitions, and aspirations as well as
				site-exclusive giveaways and surprises.
			</p></div></main>`
    })}




${$$result.head += `<link rel="${"preconnect"}" href="${"https://fonts.googleapis.com"}" data-svelte="svelte-1wsm2q3"><link rel="${"preconnect"}" href="${"https://fonts.gstatic.com"}" crossorigin data-svelte="svelte-1wsm2q3">`, ""}`;
  } while (!$$settled);
  return $$rendered;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var PICKER_TYPES = ["days", "months", "years"];
var updateSelected = (value, property) => (state) => {
  const newState = { ...state, [property]: value };
  return { ...newState, selected: new Date(newState.year, newState.month, newState.day) };
};
var pipe = (...fns) => (val) => fns.reduce((accum, fn) => fn(accum), val);
var zeroDay = (date) => (0, import_dayjs.default)(date).startOf("day").toDate();
var get = ({ selected, start, end, startOfWeekIndex = 0, shouldEnlargeDay = false }) => {
  const { subscribe: subscribe2, set, update: update2 } = writable({
    open: false,
    hasChosen: false,
    selected,
    start: zeroDay(start),
    end: zeroDay(end),
    shouldEnlargeDay,
    enlargeDay: false,
    year: selected.getFullYear(),
    month: selected.getMonth(),
    day: selected.getDate(),
    activeView: "days",
    activeViewDirection: 1,
    startOfWeekIndex
  });
  return {
    set,
    subscribe: subscribe2,
    getState() {
      return get_store_value({ subscribe: subscribe2 });
    },
    enlargeDay(enlargeDay = true) {
      update2((state) => ({ ...state, enlargeDay }));
    },
    getSelectableVector(date) {
      const { start: start2, end: end2 } = this.getState();
      if (date < start2)
        return -1;
      if (date > end2)
        return 1;
      return 0;
    },
    isSelectable(date, clamping = []) {
      const vector = this.getSelectableVector(date);
      if (vector === 0)
        return true;
      if (!clamping.length)
        return false;
      const clamped = this.clampValue((0, import_dayjs.default)(date), clamping).toDate();
      return this.isSelectable(clamped);
    },
    clampValue(day, clampable) {
      const vector = this.getSelectableVector(day.toDate());
      if (vector === 0)
        return day;
      const boundaryKey = vector === 1 ? "end" : "start";
      const boundary = (0, import_dayjs.default)(this.getState()[boundaryKey]);
      return clampable.reduce((day2, type) => day2[type](boundary[type]()), day);
    },
    add(amount, unit, clampable = []) {
      update2(({ month, year, day, ...state }) => {
        const d2 = this.clampValue((0, import_dayjs.default)(new Date(year, month, day)).add(amount, unit), clampable);
        if (!this.isSelectable(d2.toDate()))
          return { ...state, year, month, day };
        return {
          ...state,
          month: d2.month(),
          year: d2.year(),
          day: d2.date(),
          selected: d2.toDate()
        };
      });
    },
    setActiveView(newActiveView) {
      const newIndex = PICKER_TYPES.indexOf(newActiveView);
      if (newIndex === -1)
        return;
      update2(({ activeView, ...state }) => ({
        ...state,
        activeViewDirection: PICKER_TYPES.indexOf(activeView) > newIndex ? -1 : 1,
        activeView: newActiveView
      }));
    },
    setYear(year) {
      update2(updateSelected(year, "year"));
    },
    setMonth(month) {
      update2(updateSelected(month, "month"));
    },
    setDay(day) {
      update2(pipe(updateSelected(day.getDate(), "day"), updateSelected(day.getMonth(), "month"), updateSelected(day.getFullYear(), "year")));
    },
    close(extraState) {
      update2((state) => ({ ...state, ...extraState, open: false }));
    },
    selectDay() {
      this.close({ hasChosen: true });
    },
    getCalendarPage(month, year) {
      const { startOfWeekIndex: startOfWeekIndex2 } = this.getState();
      let last = { date: new Date(year, month, 1), outsider: false };
      const days = [];
      while (last.date.getMonth() === month) {
        days.push(last);
        const date = new Date(last.date);
        date.setDate(last.date.getDate() + 1);
        last = { date, outsider: false };
      }
      while (days[0].date.getDay() !== startOfWeekIndex2) {
        const date = new Date(days[0].date);
        date.setDate(days[0].date.getDate() - 1);
        days.unshift({
          date,
          outsider: true
        });
      }
      last.outsider = true;
      while (days.length < 42) {
        days.push(last);
        last = { date: new Date(last.date), outsider: true };
        last.date.setDate(last.date.getDate() + 1);
      }
      return days;
    }
  };
};
var datepickerStore = { get };
var storeContextKey = {};
var keyControlsContextKey = {};
var themeContextKey = {};
var Crossfade = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { key = {} } = $$props;
  let { duration: duration2 = (d2) => Math.max(150, Math.sqrt(d2 * 150)) } = $$props;
  let { easing = cubicInOut } = $$props;
  const [send, receive] = crossfade({
    duration: duration2,
    easing,
    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;
      return {
        duration: duration2,
        easing,
        css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
      };
    }
  });
  const store = readable({ key, send, receive });
  setContext("crossfade", store);
  if ($$props.key === void 0 && $$bindings.key && key !== void 0)
    $$bindings.key(key);
  if ($$props.duration === void 0 && $$bindings.duration && duration2 !== void 0)
    $$bindings.duration(duration2);
  if ($$props.easing === void 0 && $$bindings.easing && easing !== void 0)
    $$bindings.easing(easing);
  return `${slots.default ? slots.default({ key, send, receive }) : ``}`;
});
var css$g = {
  code: ".trigger.svelte-ff0ii6{display:inline-block}.sc-popover.svelte-ff0ii6{position:relative;display:inline-block}.contents-wrapper.svelte-ff0ii6{transform:translate(-50%, -50%);position:absolute;top:50%;left:50%;z-index:10;overflow:hidden}",
  map: `{"version":3,"file":"Popover.svelte","sources":["Popover.svelte"],"sourcesContent":["<script>\\n\\timport Crossfade from '../components/generic/crossfade/Crossfade.svelte';\\n\\timport blurr from '../directives/blurr';\\n\\timport { tick } from 'svelte';\\n\\n\\texport let isOpen = false;\\n\\texport let style = '';\\n\\n\\tlet translateY = 0;\\n\\tlet translateX = 0;\\n\\n\\tlet popover;\\n\\tlet triggerWidth;\\n\\tlet triggerHeight;\\n\\tlet contentsWrapper;\\n\\n\\texport const close = () => {\\n\\t\\tisOpen = false;\\n\\t};\\n\\n\\tconst getDistanceToEdges = () => {\\n\\t\\tlet { top, bottom, left, right } = contentsWrapper.getBoundingClientRect();\\n\\t\\treturn {\\n\\t\\t\\ttop: top + -1 * translateY,\\n\\t\\t\\tbottom: window.innerHeight - bottom + translateY,\\n\\t\\t\\tleft: left + -1 * translateX,\\n\\t\\t\\tright: document.body.clientWidth - right + translateX\\n\\t\\t};\\n\\t};\\n\\n\\tconst getY = ({ bottom, top }) => {\\n\\t\\tif (top < 0) return -1 * top;\\n\\t\\tif (bottom < 0) return bottom;\\n\\t\\treturn 0;\\n\\t};\\n\\n\\tconst getX = ({ left, right }) => {\\n\\t\\tif (left < 0) return -1 * left;\\n\\t\\tif (right < 0) return right;\\n\\t\\treturn 0;\\n\\t};\\n\\n\\tconst openPopover = async () => {\\n\\t\\tisOpen = true;\\n\\t\\tawait tick();\\n\\t\\tlet dist = getDistanceToEdges();\\n\\t\\ttranslateX = getX(dist);\\n\\t\\ttranslateY = getY(dist);\\n\\t};\\n<\/script>\\n\\n<Crossfade let:receive let:send let:key>\\n\\t<div\\n\\t\\tuse:blurr\\n\\t\\ton:blurr={close}\\n\\t\\tclass=\\"sc-popover\\"\\n\\t\\tbind:this={popover}\\n\\t\\tstyle=\\"{style}; min-width: {triggerWidth + 1}px; min-height: {triggerHeight + 1}px;\\"\\n\\t>\\n\\t\\t{#if !isOpen}\\n\\t\\t\\t<div\\n\\t\\t\\t\\tclass=\\"trigger\\"\\n\\t\\t\\t\\ton:click={openPopover}\\n\\t\\t\\t\\tbind:offsetWidth={triggerWidth}\\n\\t\\t\\t\\tbind:offsetHeight={triggerHeight}\\n\\t\\t\\t>\\n\\t\\t\\t\\t<slot {key} {send} {receive} />\\n\\t\\t\\t</div>\\n\\t\\t{:else}\\n\\t\\t\\t<div\\n\\t\\t\\t\\tclass=\\"contents-wrapper\\"\\n\\t\\t\\t\\tstyle=\\"transform: translate(-50%,-50%) translate({translateX}px, {translateY}px)\\"\\n\\t\\t\\t\\tbind:this={contentsWrapper}\\n\\t\\t\\t>\\n\\t\\t\\t\\t<div class=\\"contents\\">\\n\\t\\t\\t\\t\\t<div class=\\"contents-inner\\">\\n\\t\\t\\t\\t\\t\\t<slot name=\\"contents\\" {key} {send} {receive} />\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</div>\\n</Crossfade>\\n\\n<style>\\n\\t.trigger {\\n\\t\\tdisplay: inline-block;\\n\\t}\\n\\t.sc-popover {\\n\\t\\tposition: relative;\\n\\t\\tdisplay: inline-block;\\n\\t}\\n\\t.contents-wrapper {\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tposition: absolute;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\tz-index: 10;\\n\\t\\toverflow: hidden;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAqFC,QAAQ,cAAC,CAAC,AACT,OAAO,CAAE,YAAY,AACtB,CAAC,AACD,WAAW,cAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACtB,CAAC,AACD,iBAAiB,cAAC,CAAC,AAClB,SAAS,CAAE,UAAU,IAAI,CAAC,CAAC,IAAI,CAAC,CAChC,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,MAAM,AACjB,CAAC"}`
};
var Popover = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { isOpen = false } = $$props;
  let { style = "" } = $$props;
  let translateY = 0;
  let translateX = 0;
  let popover;
  let triggerWidth;
  let triggerHeight;
  let contentsWrapper;
  const close = () => {
    isOpen = false;
  };
  if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0)
    $$bindings.isOpen(isOpen);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  if ($$props.close === void 0 && $$bindings.close && close !== void 0)
    $$bindings.close(close);
  $$result.css.add(css$g);
  return `${validate_component(Crossfade, "Crossfade").$$render($$result, {}, {}, {
    default: ({ receive, send, key }) => `<div class="${"sc-popover svelte-ff0ii6"}" style="${escape2(style) + "; min-width: " + escape2(triggerWidth + 1) + "px; min-height: " + escape2(triggerHeight + 1) + "px;"}"${add_attribute("this", popover, 0)}>${!isOpen ? `<div class="${"trigger svelte-ff0ii6"}">${slots.default ? slots.default({ key, send, receive }) : ``}</div>` : `<div class="${"contents-wrapper svelte-ff0ii6"}" style="${"transform: translate(-50%,-50%) translate(" + escape2(translateX) + "px, " + escape2(translateY) + "px)"}"${add_attribute("this", contentsWrapper, 0)}><div class="${"contents"}"><div class="${"contents-inner"}">${slots.contents ? slots.contents({ key, send, receive }) : ``}</div></div></div>`}</div>`
  })}`;
});
var light = {
  calendar: {
    width: "700px",
    maxWidth: "100vw",
    legend: {
      height: "45px"
    },
    shadow: "0px 10px 26px rgba(0, 0, 0, 0.25)",
    colors: {
      text: {
        primary: "#333",
        highlight: "#fff"
      },
      background: {
        primary: "#fff",
        highlight: "#eb7400",
        hover: "#eee"
      },
      border: "#eee"
    },
    font: {
      regular: "1.5em",
      large: "37em"
    },
    grid: {
      disabledOpacity: ".35",
      outsiderOpacity: ".6"
    }
  }
};
var Theme = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let style;
  let { theme = {} } = $$props;
  let { appliedTheme } = $$props;
  let { prefix = "--sc-theme" } = $$props;
  let { defaultTheme = light } = $$props;
  const store = writable();
  setContext(themeContextKey, store);
  const getStyle = (obj) => Object.entries(obj).map(([k, v]) => `${prefix}-${k}: ${v}`).join(";");
  const getTheme = (defaults, overrides = {}, base2 = "") => Object.entries(defaults).reduce((acc, [k, v]) => {
    if (typeof v === "object")
      return {
        ...acc,
        ...getTheme(v, overrides[k], [base2, k].filter(Boolean).join("-"))
      };
    return {
      ...acc,
      [[base2, k].filter(Boolean).join("-")]: overrides[k] || v
    };
  }, {});
  if ($$props.theme === void 0 && $$bindings.theme && theme !== void 0)
    $$bindings.theme(theme);
  if ($$props.appliedTheme === void 0 && $$bindings.appliedTheme && appliedTheme !== void 0)
    $$bindings.appliedTheme(appliedTheme);
  if ($$props.prefix === void 0 && $$bindings.prefix && prefix !== void 0)
    $$bindings.prefix(prefix);
  if ($$props.defaultTheme === void 0 && $$bindings.defaultTheme && defaultTheme !== void 0)
    $$bindings.defaultTheme(defaultTheme);
  appliedTheme = getTheme(defaultTheme, theme);
  style = getStyle(appliedTheme);
  {
    store.set(appliedTheme);
  }
  return `${slots.default ? slots.default({ appliedTheme, style }) : ``}`;
});
var KEY_CODES = {
  33: "pageUp",
  34: "pageDown",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  27: "escape",
  13: "enter",
  17: "control"
};
var justThrottle = throttle;
function throttle(fn, interval, options2) {
  var timeoutId = null;
  var throttledFn = null;
  var leading = options2 && options2.leading;
  var trailing = options2 && options2.trailing;
  if (leading == null) {
    leading = true;
  }
  if (trailing == null) {
    trailing = !leading;
  }
  if (leading == true) {
    trailing = false;
  }
  var cancel = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  var flush2 = function() {
    var call = throttledFn;
    cancel();
    if (call) {
      call();
    }
  };
  var throttleWrapper = function() {
    var callNow = leading && !timeoutId;
    var context = this;
    var args = arguments;
    throttledFn = function() {
      return fn.apply(context, args);
    };
    if (!timeoutId) {
      timeoutId = setTimeout(function() {
        timeoutId = null;
        if (trailing) {
          return throttledFn();
        }
      }, interval);
    }
    if (callNow) {
      callNow = false;
      return throttledFn();
    }
  };
  throttleWrapper.cancel = cancel;
  throttleWrapper.flush = flush2;
  return throttleWrapper;
}
var KeyControls = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $currentCtx, $$unsubscribe_currentCtx;
  let { limit = 0 } = $$props;
  let { ctx = null } = $$props;
  const currentCtx = getContext(keyControlsContextKey);
  $$unsubscribe_currentCtx = subscribe(currentCtx, (value) => $currentCtx = value);
  const key = (evt) => {
    if (ctx && !ctx.includes($currentCtx))
      return;
    const mapping = $$props[KEY_CODES[evt.keyCode]];
    if (mapping)
      mapping();
  };
  if ($$props.limit === void 0 && $$bindings.limit && limit !== void 0)
    $$bindings.limit(limit);
  if ($$props.ctx === void 0 && $$bindings.ctx && ctx !== void 0)
    $$bindings.ctx(ctx);
  limit ? justThrottle(key, limit) : key;
  $$unsubscribe_currentCtx();
  return `

${slots.default ? slots.default({}) : ``}`;
});
var css$f = {
  code: ".grid.svelte-jmgdr0{display:grid;background:var(--sc-theme-calendar-colors-border);row-gap:1px;column-gap:1px;height:100%}.grid.svelte-jmgdr0>*{font-size:var(--sc-theme-calendar-font-regular);text-decoration:none;color:var(--sc-theme-calendar-colors-text-primary);transition:all 180ms ease-out;background:var(--sc-theme-calendar-colors-background-primary);display:grid;text-align:center;align-items:center}@media(max-width: 720px){.grid.svelte-jmgdr0>*{font-size:calc(var(--sc-theme-calendar-font-regular) * 0.75)}}.grid.svelte-jmgdr0>*:hover{background:var(--sc-theme-calendar-colors-background-hover)}.grid.svelte-jmgdr0>*.selected{background:var(--sc-theme-calendar-colors-background-highlight);color:var(--sc-theme-calendar-colors-text-highlight);opacity:1}.grid.svelte-jmgdr0>*.outsider{opacity:var(--sc-theme-calendar-grid-outsiderOpacity)}.grid.svelte-jmgdr0>*.disabled{opacity:var(--sc-theme-calendar-grid-disabledOpacity)}.grid.svelte-jmgdr0>*.disabled:hover{background:var(--sc-theme-calendar-colors-background-primary);cursor:default}",
  map: `{"version":3,"file":"Grid.svelte","sources":["Grid.svelte"],"sourcesContent":["<script>\\n\\texport let template = 'repeat(4, 1fr) / repeat(3, 1fr)';\\n<\/script>\\n\\n<div class=\\"grid\\" style=\\"grid-template: {template};\\">\\n\\t<slot />\\n</div>\\n\\n<style>\\n\\t.grid {\\n\\t\\tdisplay: grid;\\n\\t\\tbackground: var(--sc-theme-calendar-colors-border);\\n\\t\\trow-gap: 1px;\\n\\t\\tcolumn-gap: 1px;\\n\\t\\theight: 100%;\\n\\t}\\n\\t.grid > :global(*) {\\n\\t\\tfont-size: var(--sc-theme-calendar-font-regular);\\n\\t\\ttext-decoration: none;\\n\\t\\tcolor: var(--sc-theme-calendar-colors-text-primary);\\n\\t\\ttransition: all 180ms ease-out;\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\tdisplay: grid;\\n\\t\\ttext-align: center;\\n\\t\\talign-items: center;\\n\\t}\\n\\n\\t@media (max-width: 720px) {\\n\\t\\t.grid > :global(*) {\\n\\t\\t\\tfont-size: calc(var(--sc-theme-calendar-font-regular) * 0.75);\\n\\t\\t}\\n\\t}\\n\\n\\t.grid > :global(*:hover) {\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-hover);\\n\\t}\\n\\t.grid > :global(*.selected) {\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-highlight);\\n\\t\\tcolor: var(--sc-theme-calendar-colors-text-highlight);\\n\\t\\topacity: 1;\\n\\t}\\n\\t.grid > :global(*.outsider) {\\n\\t\\topacity: var(--sc-theme-calendar-grid-outsiderOpacity);\\n\\t}\\n\\t.grid > :global(*.disabled) {\\n\\t\\topacity: var(--sc-theme-calendar-grid-disabledOpacity);\\n\\t}\\n\\t.grid > :global(*.disabled:hover) {\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\tcursor: default;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AASC,KAAK,cAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,IAAI,iCAAiC,CAAC,CAClD,OAAO,CAAE,GAAG,CACZ,UAAU,CAAE,GAAG,CACf,MAAM,CAAE,IAAI,AACb,CAAC,AACD,mBAAK,CAAW,CAAC,AAAE,CAAC,AACnB,SAAS,CAAE,IAAI,gCAAgC,CAAC,CAChD,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,IAAI,uCAAuC,CAAC,CACnD,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,QAAQ,CAC9B,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,AACpB,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,mBAAK,CAAW,CAAC,AAAE,CAAC,AACnB,SAAS,CAAE,KAAK,IAAI,gCAAgC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,AAC9D,CAAC,AACF,CAAC,AAED,mBAAK,CAAW,OAAO,AAAE,CAAC,AACzB,UAAU,CAAE,IAAI,2CAA2C,CAAC,AAC7D,CAAC,AACD,mBAAK,CAAW,UAAU,AAAE,CAAC,AAC5B,UAAU,CAAE,IAAI,+CAA+C,CAAC,CAChE,KAAK,CAAE,IAAI,yCAAyC,CAAC,CACrD,OAAO,CAAE,CAAC,AACX,CAAC,AACD,mBAAK,CAAW,UAAU,AAAE,CAAC,AAC5B,OAAO,CAAE,IAAI,wCAAwC,CAAC,AACvD,CAAC,AACD,mBAAK,CAAW,UAAU,AAAE,CAAC,AAC5B,OAAO,CAAE,IAAI,wCAAwC,CAAC,AACvD,CAAC,AACD,mBAAK,CAAW,gBAAgB,AAAE,CAAC,AAClC,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,MAAM,CAAE,OAAO,AAChB,CAAC"}`
};
var Grid = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { template: template2 = "repeat(4, 1fr) / repeat(3, 1fr)" } = $$props;
  if ($$props.template === void 0 && $$bindings.template && template2 !== void 0)
    $$bindings.template(template2);
  $$result.css.add(css$f);
  return `<div class="${"grid svelte-jmgdr0"}" style="${"grid-template: " + escape2(template2) + ";"}">${slots.default ? slots.default({}) : ``}
</div>`;
});
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number" || is_date(current_value)) {
    const delta = target_value - current_value;
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
    const spring2 = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring2 - damper) * ctx.inv_mass;
    const d2 = (velocity + acceleration) * ctx.dt;
    if (Math.abs(d2) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
      return target_value;
    } else {
      ctx.settled = false;
      return is_date(current_value) ? new Date(current_value.getTime() + d2) : current_value + d2;
    }
  } else if (Array.isArray(current_value)) {
    return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
  } else if (typeof current_value === "object") {
    const next_value = {};
    for (const k in current_value) {
      next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
    }
    return next_value;
  } else {
    throw new Error(`Cannot spring ${typeof current_value} values`);
  }
}
function spring(value, opts = {}) {
  const store = writable(value);
  const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
  let last_time;
  let task;
  let current_token;
  let last_value = value;
  let target_value = value;
  let inv_mass = 1;
  let inv_mass_recovery_rate = 0;
  let cancel_task = false;
  function set(new_value, opts2 = {}) {
    target_value = new_value;
    const token = current_token = {};
    if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
      cancel_task = true;
      last_time = now();
      last_value = new_value;
      store.set(value = target_value);
      return Promise.resolve();
    } else if (opts2.soft) {
      const rate = opts2.soft === true ? 0.5 : +opts2.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0;
    }
    if (!task) {
      last_time = now();
      cancel_task = false;
      task = loop((now2) => {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        const ctx = {
          inv_mass,
          opts: spring2,
          settled: true,
          dt: (now2 - last_time) * 60 / 1e3
        };
        const next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now2;
        last_value = value;
        store.set(value = next_value);
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    return new Promise((fulfil) => {
      task.promise.then(() => {
        if (token === current_token)
          fulfil();
      });
    });
  }
  const spring2 = {
    set,
    update: (fn, opts2) => set(fn(target_value, value), opts2),
    subscribe: store.subscribe,
    stiffness,
    damping,
    precision
  };
  return spring2;
}
var css$e = {
  code: ".grid.svelte-198r3wi.svelte-198r3wi{overflow:hidden;height:100%;display:grid}.grid.svelte-198r3wi>.svelte-198r3wi{position:absolute;top:0;left:0;right:0;bottom:0;transition-property:none !important}",
  map: `{"version":3,"file":"InfiniteGrid.svelte","sources":["InfiniteGrid.svelte"],"sourcesContent":["<script>\\n\\timport { tick } from 'svelte';\\n\\n\\timport { spring } from 'svelte/motion';\\n\\timport { derived, writable } from 'svelte/store';\\n\\n\\texport let cellCount = 4;\\n\\texport let itemCount = 0;\\n\\texport let index = 0;\\n\\texport let vertical = true;\\n\\texport let get;\\n\\texport let stiffness = 0.065;\\n\\texport let damping = 0.9;\\n\\texport let useCache = true;\\n\\texport let idKey = undefined;\\n\\n\\texport const move = (amount) => {\\n\\t\\tindex = Math.max(0, Math.min(itemCount - 1, index + amount));\\n\\t};\\n\\n\\tconst forceUpdate = writable(false);\\n\\texport const triggerUpdate = async () => {\\n\\t\\tawait tick();\\n\\t\\tforceUpdate.set(true);\\n\\t\\tawait tick();\\n\\t\\tforceUpdate.set(false);\\n\\t};\\n\\n\\tconst getCached = (index) => $visibleData.find(({ index: i }) => i === index)?.data || get(index);\\n\\n\\tlet inRange = [-Infinity, Infinity];\\n\\tconst initialized = writable(false);\\n\\tconst dim = writable({ w: 0, h: 0 });\\n\\tconst offset = spring(0, { stiffness, damping });\\n\\texport const visibleData = derived(\\n\\t\\t[dim, offset, initialized, forceUpdate],\\n\\t\\t([{ w, h }, $o, $initialized, $force]) => {\\n\\t\\t\\tif (!w || !h || !$initialized) return [];\\n\\t\\t\\tif ($o < inRange[0] || $o > inRange[1]) return $visibleData;\\n\\t\\t\\tconst divisibleHeight = cellCount > 1 ? h + (cellCount - (h % cellCount)) : h;\\n\\t\\t\\tconst cellHeight = h / cellCount;\\n\\t\\t\\tconst start = Math.max(-1, Math.floor((-1 * $o) / cellHeight) - 1);\\n\\t\\t\\tconst baseOffset = $o % cellHeight;\\n\\t\\t\\treturn Array(cellCount + 2)\\n\\t\\t\\t\\t.fill(0)\\n\\t\\t\\t\\t.map((_, i) => {\\n\\t\\t\\t\\t\\tconst index = i + start;\\n\\t\\t\\t\\t\\tconst pos = baseOffset + (i - 1) * cellHeight;\\n\\t\\t\\t\\t\\tif (index < 0 || index >= itemCount) return undefined;\\n\\t\\t\\t\\t\\tconst data = $force || !useCache ? get(index) : getCached(index);\\n\\t\\t\\t\\t\\treturn { data, pos, index };\\n\\t\\t\\t\\t})\\n\\t\\t\\t\\t.filter(Boolean);\\n\\t\\t},\\n\\t\\t[]\\n\\t);\\n\\n\\tconst updateOffset = (o) => {\\n\\t\\tinRange = [o, $offset].sort((a, b) => a - b);\\n\\t\\toffset.set(o, { hard: !$initialized });\\n\\t};\\n\\n\\t$: type = vertical ? 'rows' : 'columns';\\n\\t$: gridStyle = \`grid-template-\${type}: repeat(\${cellCount}, 1fr);\`;\\n\\t$: {\\n\\t\\tif ($dim.w && $dim.h) {\\n\\t\\t\\tupdateOffset(($dim.h / cellCount) * index * -1);\\n\\t\\t\\tif (!$initialized) initialized.set(true);\\n\\t\\t}\\n\\t}\\n<\/script>\\n\\n<div class=\\"grid\\" style={gridStyle} bind:clientHeight={$dim.h} bind:clientWidth={$dim.w}>\\n\\t{#each $visibleData as obj (obj.data?.[idKey] || obj.index)}\\n\\t\\t<div style=\\"transform: translateY({obj.pos}px)\\">\\n\\t\\t\\t<slot {...obj.data} index={obj.index} />\\n\\t\\t</div>\\n\\t{/each}\\n</div>\\n\\n<style>\\n\\t.grid {\\n\\t\\toverflow: hidden;\\n\\t\\theight: 100%;\\n\\t\\tdisplay: grid;\\n\\t}\\n\\t.grid > * {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\tright: 0;\\n\\t\\tbottom: 0;\\n\\t\\ttransition-property: none !important;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAiFC,KAAK,8BAAC,CAAC,AACN,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,AACd,CAAC,AACD,oBAAK,CAAG,eAAE,CAAC,AACV,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,mBAAmB,CAAE,IAAI,CAAC,UAAU,AACrC,CAAC"}`
};
var InfiniteGrid = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let type;
  let gridStyle;
  let $initialized, $$unsubscribe_initialized;
  let $dim, $$unsubscribe_dim;
  let $offset, $$unsubscribe_offset;
  let $visibleData, $$unsubscribe_visibleData;
  let { cellCount = 4 } = $$props;
  let { itemCount = 0 } = $$props;
  let { index: index2 = 0 } = $$props;
  let { vertical = true } = $$props;
  let { get: get2 } = $$props;
  let { stiffness = 0.065 } = $$props;
  let { damping = 0.9 } = $$props;
  let { useCache = true } = $$props;
  let { idKey = void 0 } = $$props;
  const move = (amount) => {
    index2 = Math.max(0, Math.min(itemCount - 1, index2 + amount));
  };
  const forceUpdate = writable(false);
  const triggerUpdate = async () => {
    await tick();
    forceUpdate.set(true);
    await tick();
    forceUpdate.set(false);
  };
  const getCached = (index3) => {
    var _a;
    return ((_a = $visibleData.find(({ index: i }) => i === index3)) == null ? void 0 : _a.data) || get2(index3);
  };
  let inRange = [-Infinity, Infinity];
  const initialized = writable(false);
  $$unsubscribe_initialized = subscribe(initialized, (value) => $initialized = value);
  const dim = writable({ w: 0, h: 0 });
  $$unsubscribe_dim = subscribe(dim, (value) => $dim = value);
  const offset = spring(0, { stiffness, damping });
  $$unsubscribe_offset = subscribe(offset, (value) => $offset = value);
  const visibleData = derived([dim, offset, initialized, forceUpdate], ([{ w, h }, $o, $initialized2, $force]) => {
    if (!w || !h || !$initialized2)
      return [];
    if ($o < inRange[0] || $o > inRange[1])
      return $visibleData;
    const cellHeight = h / cellCount;
    const start = Math.max(-1, Math.floor(-1 * $o / cellHeight) - 1);
    const baseOffset = $o % cellHeight;
    return Array(cellCount + 2).fill(0).map((_, i) => {
      const index3 = i + start;
      const pos = baseOffset + (i - 1) * cellHeight;
      if (index3 < 0 || index3 >= itemCount)
        return void 0;
      const data = $force || !useCache ? get2(index3) : getCached(index3);
      return { data, pos, index: index3 };
    }).filter(Boolean);
  }, []);
  $$unsubscribe_visibleData = subscribe(visibleData, (value) => $visibleData = value);
  const updateOffset = (o) => {
    inRange = [o, $offset].sort((a, b) => a - b);
    offset.set(o, { hard: !$initialized });
  };
  if ($$props.cellCount === void 0 && $$bindings.cellCount && cellCount !== void 0)
    $$bindings.cellCount(cellCount);
  if ($$props.itemCount === void 0 && $$bindings.itemCount && itemCount !== void 0)
    $$bindings.itemCount(itemCount);
  if ($$props.index === void 0 && $$bindings.index && index2 !== void 0)
    $$bindings.index(index2);
  if ($$props.vertical === void 0 && $$bindings.vertical && vertical !== void 0)
    $$bindings.vertical(vertical);
  if ($$props.get === void 0 && $$bindings.get && get2 !== void 0)
    $$bindings.get(get2);
  if ($$props.stiffness === void 0 && $$bindings.stiffness && stiffness !== void 0)
    $$bindings.stiffness(stiffness);
  if ($$props.damping === void 0 && $$bindings.damping && damping !== void 0)
    $$bindings.damping(damping);
  if ($$props.useCache === void 0 && $$bindings.useCache && useCache !== void 0)
    $$bindings.useCache(useCache);
  if ($$props.idKey === void 0 && $$bindings.idKey && idKey !== void 0)
    $$bindings.idKey(idKey);
  if ($$props.move === void 0 && $$bindings.move && move !== void 0)
    $$bindings.move(move);
  if ($$props.triggerUpdate === void 0 && $$bindings.triggerUpdate && triggerUpdate !== void 0)
    $$bindings.triggerUpdate(triggerUpdate);
  if ($$props.visibleData === void 0 && $$bindings.visibleData && visibleData !== void 0)
    $$bindings.visibleData(visibleData);
  $$result.css.add(css$e);
  type = vertical ? "rows" : "columns";
  gridStyle = `grid-template-${type}: repeat(${cellCount}, 1fr);`;
  {
    {
      if ($dim.w && $dim.h) {
        updateOffset($dim.h / cellCount * index2 * -1);
        if (!$initialized)
          initialized.set(true);
      }
    }
  }
  $$unsubscribe_initialized();
  $$unsubscribe_dim();
  $$unsubscribe_offset();
  $$unsubscribe_visibleData();
  return `<div class="${"grid svelte-198r3wi"}"${add_attribute("style", gridStyle, 0)}>${each($visibleData, (obj) => `<div style="${"transform: translateY(" + escape2(obj.pos) + "px)"}" class="${"svelte-198r3wi"}">${slots.default ? slots.default({ ...obj.data, index: obj.index }) : ``}
		</div>`)}
</div>`;
});
var css$d = {
  code: ".container.svelte-1unzsxu{display:grid;grid-template-rows:auto 1fr}.legend.svelte-1unzsxu{display:grid;grid-template:1fr / repeat(7, 1fr);height:var(--sc-theme-calendar-legend-height);z-index:2;background:var(--sc-theme-calendar-colors-background-primary);border-bottom:1px solid var(--sc-theme-calendar-colors-border);align-items:center}a.svelte-1unzsxu{font-size:1em}.stage.svelte-1unzsxu{display:grid;grid-row:2;grid-column:1}.selected-big.svelte-1unzsxu{color:var(--sc-theme-calendar-colors-background-highlight);background:var(--sc-theme-calendar-colors-background-hover);text-align:center;align-items:center;font-size:var(--sc-theme-calendar-font-large);z-index:2;opacity:1;line-height:0}@media(max-width: 720px){.selected-big.svelte-1unzsxu{font-size:calc(var(--sc-theme-calendar-font-large) * 0.7)}}",
  map: `{"version":3,"file":"DayPicker.svelte","sources":["DayPicker.svelte"],"sourcesContent":["<script>\\n\\timport { getContext } from 'svelte';\\n\\timport { storeContextKey } from '../../context';\\n\\timport KeyControls from '../../components/generic/KeyControls.svelte';\\n\\timport Grid from '../../components/generic/Grid.svelte';\\n\\timport InfiniteGrid from '../../components/generic/InfiniteGrid.svelte';\\n\\timport dayjs from 'dayjs';\\n\\timport Crossfade from '../generic/crossfade/Crossfade.svelte';\\n\\timport scrollable from '../../directives/scrollable';\\n\\timport { scrollStep } from '../../config/scroll';\\n\\n\\tconst store = getContext(storeContextKey);\\n\\n\\tconst duration = 450;\\n\\n\\tconst legend = Array(7)\\n\\t\\t.fill(0)\\n\\t\\t.map((d, i) =>\\n\\t\\t\\tdayjs()\\n\\t\\t\\t\\t.day(($store.startOfWeekIndex + i) % 7)\\n\\t\\t\\t\\t.format('ddd')\\n\\t\\t);\\n\\n\\tconst add = (amount) => () => store.add(amount, 'day');\\n\\n\\tconst select = (day) => () => {\\n\\t\\tif (!store.isSelectable(day)) return;\\n\\t\\tstore.setDay(day || $store.selected);\\n\\t\\tif (!$store.shouldEnlargeDay) return store.selectDay();\\n\\t\\tstore.enlargeDay();\\n\\t\\tsetTimeout(() => {\\n\\t\\t\\tstore.selectDay();\\n\\t\\t\\tstore.enlargeDay(false);\\n\\t\\t}, duration + 60);\\n\\t};\\n\\n\\tconst KEY_MAPPINGS = {\\n\\t\\tleft: add(-1),\\n\\t\\tright: add(1),\\n\\t\\tup: add(-7),\\n\\t\\tdown: add(7),\\n\\t\\tenter: select(),\\n\\t\\tescape: () => store.close()\\n\\t};\\n\\n\\tconst calPagesBetweenDates = (a, b) => {\\n\\t\\tconst yearDelta = b.getFullYear() - a.getFullYear();\\n\\t\\tconst firstPartialYear = yearDelta ? 12 - a.getMonth() : b.getMonth() - a.getMonth() + 1;\\n\\t\\tconst fullYears = yearDelta > 1 ? (yearDelta - 1) * 12 : 0;\\n\\t\\tconst lastPartialYear = yearDelta ? b.getMonth() + 1 : 0;\\n\\t\\treturn firstPartialYear + fullYears + lastPartialYear;\\n\\t};\\n\\n\\tconst get = (index) => {\\n\\t\\tconst d = dayjs($store.start).add(index, 'month');\\n\\t\\treturn { days: store.getCalendarPage(d.month(), d.year()) };\\n\\t};\\n\\n\\tconst updateIndex = ({ detail: { step: newIndex } }) => {\\n\\t\\tstore.add(newIndex - monthIndex, 'month', ['date']);\\n\\t};\\n\\n\\t$: totalMonths = calPagesBetweenDates($store.start, $store.end);\\n\\t$: monthIndex = calPagesBetweenDates($store.start, $store.selected) - 1;\\n\\t$: initialY = monthIndex * scrollStep;\\n<\/script>\\n\\n<KeyControls {...KEY_MAPPINGS} ctx={['days']} />\\n\\n<div class=\\"container\\">\\n\\t<div class=\\"legend\\">\\n\\t\\t{#each legend as label}\\n\\t\\t\\t<span>{label}</span>\\n\\t\\t{/each}\\n\\t</div>\\n\\t<Crossfade {duration} let:key let:receive let:send>\\n\\t\\t<div class=\\"stage\\" use:scrollable={{ y: initialY, step: scrollStep }} on:y={updateIndex}>\\n\\t\\t\\t<InfiniteGrid\\n\\t\\t\\t\\tcellCount={1}\\n\\t\\t\\t\\titemCount={totalMonths}\\n\\t\\t\\t\\tbind:index={monthIndex}\\n\\t\\t\\t\\t{get}\\n\\t\\t\\t\\tlet:days\\n\\t\\t\\t\\tlet:index\\n\\t\\t\\t>\\n\\t\\t\\t\\t<Grid template=\\"repeat(6, 1fr) / repeat(7, 1fr)\\">\\n\\t\\t\\t\\t\\t{#each days as day, i (day)}\\n\\t\\t\\t\\t\\t\\t{#if !$store.enlargeDay || index !== monthIndex || !dayjs(day.date).isSame($store.selected)}\\n\\t\\t\\t\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\t\\t\\t\\thref=\\"#pickday\\"\\n\\t\\t\\t\\t\\t\\t\\t\\ton:keydown|preventDefault\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click|preventDefault={select(day.date)}\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:disabled={!store.isSelectable(day.date)}\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:selected={index === monthIndex &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdayjs(day.date).isSame($store.selected, 'day')}\\n\\t\\t\\t\\t\\t\\t\\t\\tclass:outsider={day.outsider}\\n\\t\\t\\t\\t\\t\\t\\t\\tout:send|local={{ key }}\\n\\t\\t\\t\\t\\t\\t\\t\\tin:receive|local={{ key }}\\n\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t{day.date.getDate()}\\n\\t\\t\\t\\t\\t\\t\\t</a>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</Grid>\\n\\t\\t\\t</InfiniteGrid>\\n\\t\\t</div>\\n\\t\\t{#if $store.enlargeDay}\\n\\t\\t\\t<div class=\\"stage selected-big\\" in:receive|local={{ key }} out:send|local={{ key }}>\\n\\t\\t\\t\\t{dayjs($store.selected).date()}\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</Crossfade>\\n</div>\\n\\n<style>\\n\\t.container {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-rows: auto 1fr;\\n\\t}\\n\\t.legend {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template: 1fr / repeat(7, 1fr);\\n\\t\\theight: var(--sc-theme-calendar-legend-height);\\n\\t\\tz-index: 2;\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\tborder-bottom: 1px solid var(--sc-theme-calendar-colors-border);\\n\\t\\talign-items: center;\\n\\t}\\n\\ta {\\n\\t\\tfont-size: 1em;\\n\\t}\\n\\t.stage {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-row: 2;\\n\\t\\tgrid-column: 1;\\n\\t}\\n\\t.selected-big {\\n\\t\\tcolor: var(--sc-theme-calendar-colors-background-highlight);\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-hover);\\n\\t\\ttext-align: center;\\n\\t\\talign-items: center;\\n\\t\\tfont-size: var(--sc-theme-calendar-font-large);\\n\\t\\tz-index: 2;\\n\\t\\topacity: 1;\\n\\t\\tline-height: 0;\\n\\t}\\n\\n\\t@media (max-width: 720px) {\\n\\t\\t.selected-big {\\n\\t\\t\\tfont-size: calc(var(--sc-theme-calendar-font-large) * 0.7);\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAmHC,UAAU,eAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,IAAI,CAAC,GAAG,AAC7B,CAAC,AACD,OAAO,eAAC,CAAC,AACR,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,GAAG,CAAC,CAAC,CAAC,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CACnC,MAAM,CAAE,IAAI,iCAAiC,CAAC,CAC9C,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,iCAAiC,CAAC,CAC/D,WAAW,CAAE,MAAM,AACpB,CAAC,AACD,CAAC,eAAC,CAAC,AACF,SAAS,CAAE,GAAG,AACf,CAAC,AACD,MAAM,eAAC,CAAC,AACP,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,CAAC,CACX,WAAW,CAAE,CAAC,AACf,CAAC,AACD,aAAa,eAAC,CAAC,AACd,KAAK,CAAE,IAAI,+CAA+C,CAAC,CAC3D,UAAU,CAAE,IAAI,2CAA2C,CAAC,CAC5D,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,IAAI,8BAA8B,CAAC,CAC9C,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,CAAC,CACV,WAAW,CAAE,CAAC,AACf,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,aAAa,eAAC,CAAC,AACd,SAAS,CAAE,KAAK,IAAI,8BAA8B,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AAC3D,CAAC,AACF,CAAC"}`
};
var duration = 450;
var DayPicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let totalMonths;
  let monthIndex;
  let $store, $$unsubscribe_store;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  const legend = Array(7).fill(0).map((d2, i) => (0, import_dayjs.default)().day(($store.startOfWeekIndex + i) % 7).format("ddd"));
  const add = (amount) => () => store.add(amount, "day");
  const select = (day) => () => {
    if (!store.isSelectable(day))
      return;
    store.setDay(day || $store.selected);
    if (!$store.shouldEnlargeDay)
      return store.selectDay();
    store.enlargeDay();
    setTimeout(() => {
      store.selectDay();
      store.enlargeDay(false);
    }, duration + 60);
  };
  const KEY_MAPPINGS = {
    left: add(-1),
    right: add(1),
    up: add(-7),
    down: add(7),
    enter: select(),
    escape: () => store.close()
  };
  const calPagesBetweenDates = (a, b) => {
    const yearDelta = b.getFullYear() - a.getFullYear();
    const firstPartialYear = yearDelta ? 12 - a.getMonth() : b.getMonth() - a.getMonth() + 1;
    const fullYears = yearDelta > 1 ? (yearDelta - 1) * 12 : 0;
    const lastPartialYear = yearDelta ? b.getMonth() + 1 : 0;
    return firstPartialYear + fullYears + lastPartialYear;
  };
  const get2 = (index2) => {
    const d2 = (0, import_dayjs.default)($store.start).add(index2, "month");
    return {
      days: store.getCalendarPage(d2.month(), d2.year())
    };
  };
  $$result.css.add(css$d);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    totalMonths = calPagesBetweenDates($store.start, $store.end);
    monthIndex = calPagesBetweenDates($store.start, $store.selected) - 1;
    $$rendered = `${validate_component(KeyControls, "KeyControls").$$render($$result, Object.assign(KEY_MAPPINGS, { ctx: ["days"] }), {}, {})}

<div class="${"container svelte-1unzsxu"}"><div class="${"legend svelte-1unzsxu"}">${each(legend, (label) => `<span>${escape2(label)}</span>`)}</div>
	${validate_component(Crossfade, "Crossfade").$$render($$result, { duration }, {}, {
      default: ({ key, receive, send }) => `<div class="${"stage svelte-1unzsxu"}">${validate_component(InfiniteGrid, "InfiniteGrid").$$render($$result, {
        cellCount: 1,
        itemCount: totalMonths,
        get: get2,
        index: monthIndex
      }, {
        index: ($$value) => {
          monthIndex = $$value;
          $$settled = false;
        }
      }, {
        default: ({ days, index: index2 }) => `${validate_component(Grid, "Grid").$$render($$result, {
          template: "repeat(6, 1fr) / repeat(7, 1fr)"
        }, {}, {
          default: () => `${each(days, (day, i) => `${!$store.enlargeDay || index2 !== monthIndex || !(0, import_dayjs.default)(day.date).isSame($store.selected) ? `<a href="${"#pickday"}" class="${[
            "svelte-1unzsxu",
            (!store.isSelectable(day.date) ? "disabled" : "") + " " + (index2 === monthIndex && (0, import_dayjs.default)(day.date).isSame($store.selected, "day") ? "selected" : "") + " " + (day.outsider ? "outsider" : "")
          ].join(" ").trim()}">${escape2(day.date.getDate())}
							</a>` : ``}`)}`
        })}`
      })}</div>
		${$store.enlargeDay ? `<div class="${"stage selected-big svelte-1unzsxu"}">${escape2((0, import_dayjs.default)($store.selected).date())}</div>` : ``}`
    })}
</div>`;
  } while (!$$settled);
  $$unsubscribe_store();
  return $$rendered;
});
var ViewTransitionEffect = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_store;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => value);
  $$unsubscribe_store();
  return `<div>${slots.default ? slots.default({}) : ``}</div>`;
});
var css$c = {
  code: "i.svelte-1eiemu5{display:inline-block;width:23px;height:23px;border-style:solid;border-color:var(--sc-theme-calendar-colors-text-primary);border-width:0;border-bottom-width:3px;border-right-width:3px;transform-origin:center center}i.right.svelte-1eiemu5{transform:translateX(-6px) rotate(-45deg)}i.left.svelte-1eiemu5{transform:translateX(6px) rotate(135deg)}",
  map: `{"version":3,"file":"Arrow.svelte","sources":["Arrow.svelte"],"sourcesContent":["<script>\\n\\texport let dir = 'left';\\n<\/script>\\n\\n<i class={dir} />\\n\\n<style>\\n\\ti {\\n\\t\\tdisplay: inline-block;\\n\\t\\twidth: 23px;\\n\\t\\theight: 23px;\\n\\t\\tborder-style: solid;\\n\\t\\tborder-color: var(--sc-theme-calendar-colors-text-primary);\\n\\t\\tborder-width: 0;\\n\\t\\tborder-bottom-width: 3px;\\n\\t\\tborder-right-width: 3px;\\n\\t\\ttransform-origin: center center;\\n\\t}\\n\\ti.right {\\n\\t\\ttransform: translateX(-6px) rotate(-45deg);\\n\\t}\\n\\ti.left {\\n\\t\\ttransform: translateX(6px) rotate(135deg);\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAOC,CAAC,eAAC,CAAC,AACF,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,YAAY,CAAE,KAAK,CACnB,YAAY,CAAE,IAAI,uCAAuC,CAAC,CAC1D,YAAY,CAAE,CAAC,CACf,mBAAmB,CAAE,GAAG,CACxB,kBAAkB,CAAE,GAAG,CACvB,gBAAgB,CAAE,MAAM,CAAC,MAAM,AAChC,CAAC,AACD,CAAC,MAAM,eAAC,CAAC,AACR,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,OAAO,MAAM,CAAC,AAC3C,CAAC,AACD,CAAC,KAAK,eAAC,CAAC,AACP,SAAS,CAAE,WAAW,GAAG,CAAC,CAAC,OAAO,MAAM,CAAC,AAC1C,CAAC"}`
};
var Arrow = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { dir = "left" } = $$props;
  if ($$props.dir === void 0 && $$bindings.dir && dir !== void 0)
    $$bindings.dir(dir);
  $$result.css.add(css$c);
  return `<i class="${escape2(null_to_empty(dir)) + " svelte-1eiemu5"}"></i>`;
});
var css$b = {
  code: ".controls.svelte-1ro74h8{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;text-align:center;z-index:2;border-bottom:1px solid var(--sc-theme-calendar-colors-border);font-size:1.5em;overflow:hidden}.controls.svelte-1ro74h8>*{height:80px;padding:0 17px;display:grid;align-items:center}.button.svelte-1ro74h8{padding:10px 18px;cursor:pointer;background:var(--sc-theme-calendar-colors-background-primary);transition:all 100ms linear}.button.svelte-1ro74h8:hover{background:var(--sc-theme-calendar-colors-background-hover)}.label.svelte-1ro74h8{font-weight:bold}",
  map: `{"version":3,"file":"CalendarControls.svelte","sources":["CalendarControls.svelte"],"sourcesContent":["<script>\\n\\timport Arrow from '../../components/generic/Arrow.svelte';\\n\\timport { getContext } from 'svelte';\\n\\timport { storeContextKey } from '../../context';\\n\\timport dayjs from 'dayjs';\\n\\timport KeyControls from '../../components/generic/KeyControls.svelte';\\n\\n\\tconst store = getContext(storeContextKey);\\n\\n\\tconst UNIT_BY_VIEW = {\\n\\t\\tdays: 'month',\\n\\t\\tmonths: 'year',\\n\\t\\tyears: 'year'\\n\\t};\\n\\n\\t$: visibleMonth = dayjs(new Date($store.year, $store.month, 1));\\n\\t$: label = \`\${$store.activeView === 'days' ? visibleMonth.format('MMMM ') : ''}\${$store.year}\`;\\n\\t$: addMult = $store.activeView === 'years' ? 10 : 1;\\n\\n\\tconst add = (amount) => () => store.add(amount * addMult, UNIT_BY_VIEW[$store.activeView]);\\n\\n\\tconst VIEW_TRANSITIONS = ['days', 'months', 'years'];\\n\\tconst updateActiveView = () => {\\n\\t\\tconst transitionIndex = VIEW_TRANSITIONS.indexOf($store.activeView) + 1;\\n\\t\\tconst newView = transitionIndex ? VIEW_TRANSITIONS[transitionIndex] : null;\\n\\t\\tif (newView) store.setActiveView(newView);\\n\\t};\\n\\n\\tconst KEY_MAPPINGS = {\\n\\t\\tpageDown: add(-1),\\n\\t\\tpageUp: add(1),\\n\\t\\tcontrol: updateActiveView\\n\\t};\\n<\/script>\\n\\n<KeyControls ctx={['days', 'months', 'years']} limit={180} {...KEY_MAPPINGS} />\\n<div class=\\"controls\\">\\n\\t<div class=\\"button\\" on:click={add(-1)}>\\n\\t\\t<Arrow dir=\\"left\\" />\\n\\t</div>\\n\\t<span class=\\"button label\\" on:click={updateActiveView}>\\n\\t\\t{label}\\n\\t</span>\\n\\t<div class=\\"button\\" on:click={add(1)}>\\n\\t\\t<Arrow dir=\\"right\\" />\\n\\t</div>\\n</div>\\n\\n<style>\\n\\t.controls {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: auto 1fr auto auto;\\n\\t\\talign-items: center;\\n\\t\\ttext-align: center;\\n\\t\\tz-index: 2;\\n\\t\\tborder-bottom: 1px solid var(--sc-theme-calendar-colors-border);\\n\\t\\t/* box-shadow: 0px 4px 3px rgba(0, 0, 0, 0.15); */\\n\\t\\tfont-size: 1.5em;\\n\\t\\t/* color: var(--sc-theme-calendar-colors-text-primary); */\\n\\t\\toverflow: hidden;\\n\\t}\\n\\t.controls > :global(*) {\\n\\t\\theight: 80px;\\n\\t\\tpadding: 0 17px;\\n\\t\\tdisplay: grid;\\n\\t\\talign-items: center;\\n\\t}\\n\\t.button {\\n\\t\\tpadding: 10px 18px;\\n\\t\\tcursor: pointer;\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\ttransition: all 100ms linear;\\n\\t}\\n\\t.button:hover {\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-hover);\\n\\t}\\n\\t.label {\\n\\t\\tfont-weight: bold;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAiDC,SAAS,eAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,IAAI,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,CACzC,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CACV,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,iCAAiC,CAAC,CAE/D,SAAS,CAAE,KAAK,CAEhB,QAAQ,CAAE,MAAM,AACjB,CAAC,AACD,wBAAS,CAAW,CAAC,AAAE,CAAC,AACvB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,CAAC,CAAC,IAAI,CACf,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,AACpB,CAAC,AACD,OAAO,eAAC,CAAC,AACR,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,MAAM,AAC7B,CAAC,AACD,sBAAO,MAAM,AAAC,CAAC,AACd,UAAU,CAAE,IAAI,2CAA2C,CAAC,AAC7D,CAAC,AACD,MAAM,eAAC,CAAC,AACP,WAAW,CAAE,IAAI,AAClB,CAAC"}`
};
var CalendarControls = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let visibleMonth;
  let label;
  let addMult;
  let $store, $$unsubscribe_store;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  const UNIT_BY_VIEW = {
    days: "month",
    months: "year",
    years: "year"
  };
  const add = (amount) => () => store.add(amount * addMult, UNIT_BY_VIEW[$store.activeView]);
  const VIEW_TRANSITIONS = ["days", "months", "years"];
  const updateActiveView = () => {
    const transitionIndex = VIEW_TRANSITIONS.indexOf($store.activeView) + 1;
    const newView = transitionIndex ? VIEW_TRANSITIONS[transitionIndex] : null;
    if (newView)
      store.setActiveView(newView);
  };
  const KEY_MAPPINGS = {
    pageDown: add(-1),
    pageUp: add(1),
    control: updateActiveView
  };
  $$result.css.add(css$b);
  visibleMonth = (0, import_dayjs.default)(new Date($store.year, $store.month, 1));
  label = `${$store.activeView === "days" ? visibleMonth.format("MMMM ") : ""}${$store.year}`;
  addMult = $store.activeView === "years" ? 10 : 1;
  $$unsubscribe_store();
  return `${validate_component(KeyControls, "KeyControls").$$render($$result, Object.assign({ ctx: ["days", "months", "years"] }, { limit: 180 }, KEY_MAPPINGS), {}, {})}
<div class="${"controls svelte-1ro74h8"}"><div class="${"button svelte-1ro74h8"}">${validate_component(Arrow, "Arrow").$$render($$result, { dir: "left" }, {}, {})}</div>
	<span class="${"button label svelte-1ro74h8"}">${escape2(label)}</span>
	<div class="${"button svelte-1ro74h8"}">${validate_component(Arrow, "Arrow").$$render($$result, { dir: "right" }, {}, {})}</div>
</div>`;
});
var CrossfadeProvider = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $store, $$unsubscribe_store;
  const noop2 = () => false;
  const store = getContext("crossfade") || writable({ send: noop2, receive: noop2 });
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  $$unsubscribe_store();
  return `${slots.default ? slots.default({
    key: $store.key,
    send: $store.send,
    receive: $store.receive
  }) : ``}`;
});
var css$a = {
  code: "div.svelte-t161t{display:grid;height:100%}",
  map: `{"version":3,"file":"MonthPicker.svelte","sources":["MonthPicker.svelte"],"sourcesContent":["<script>\\n\\timport { getContext } from 'svelte';\\n\\timport { storeContextKey } from '../../context';\\n\\timport dayjs from 'dayjs';\\n\\timport KeyControls from '../../components/generic/KeyControls.svelte';\\n\\timport Grid from '../../components/generic/Grid.svelte';\\n\\timport InfiniteGrid from '../../components/generic/InfiniteGrid.svelte';\\n\\timport scrollable from '../../directives/scrollable';\\n\\timport { scrollStep } from '../../config/scroll';\\n\\n\\tconst store = getContext(storeContextKey);\\n\\n\\tlet grid;\\n\\n\\tconst get = (index) => ({\\n\\t\\tmonths: Array(12)\\n\\t\\t\\t.fill(0)\\n\\t\\t\\t.map((d, i) => {\\n\\t\\t\\t\\tconst month = dayjs(new Date($store.start.getFullYear() + index, i, 1));\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\tyear: $store.start.getFullYear() + index,\\n\\t\\t\\t\\t\\tlabel: month.format('MMM'),\\n\\t\\t\\t\\t\\tindex: i,\\n\\t\\t\\t\\t\\tdisabled: !store.isSelectable(month, ['date'])\\n\\t\\t\\t\\t};\\n\\t\\t\\t})\\n\\t});\\n\\n\\tconst close = () => store.setActiveView('days');\\n\\n\\tconst select = (month) => () => {\\n\\t\\tif (month.disabled) return;\\n\\t\\tstore.setMonth(month.index);\\n\\t\\tclose();\\n\\t};\\n\\n\\tconst add = (amount) => () => {\\n\\t\\tstore.add(amount, 'month', ['date']);\\n\\t};\\n\\n\\tconst updateIndex = ({ detail: { step: newIndex } }) => {\\n\\t\\tstore.add(newIndex - yearIndex, 'year', ['month', 'date']);\\n\\t};\\n\\n\\tconst KEY_MAPPINGS = {\\n\\t\\tleft: add(-1),\\n\\t\\tright: add(1),\\n\\t\\tup: add(-3),\\n\\t\\tdown: add(3),\\n\\t\\tenter: close,\\n\\t\\tescape: close\\n\\t};\\n\\n\\t$: yearIndex = $store.year - $store.start.getFullYear();\\n\\t$: initialY = yearIndex * scrollStep;\\n\\t$: itemCount = $store.end.getFullYear() - $store.start.getFullYear() + 1;\\n<\/script>\\n\\n<KeyControls {...KEY_MAPPINGS} ctx={['months']} />\\n<div use:scrollable={{ y: initialY, step: scrollStep, maxSteps: itemCount }} on:y={updateIndex}>\\n\\t<InfiniteGrid cellCount={1} {itemCount} bind:index={yearIndex} {get} let:months bind:this={grid}>\\n\\t\\t<Grid template=\\"repeat(4, 1fr) / repeat(3, 1fr)\\">\\n\\t\\t\\t{#each months as month, i}\\n\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\tclass:disabled={month.disabled}\\n\\t\\t\\t\\t\\tclass:selected={$store.month === i && $store.year === month.year}\\n\\t\\t\\t\\t\\thref=\\"#selectMonth\\"\\n\\t\\t\\t\\t\\ton:click|preventDefault={select(month)}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{month.label}\\n\\t\\t\\t\\t</a>\\n\\t\\t\\t{/each}\\n\\t\\t</Grid>\\n\\t</InfiniteGrid>\\n</div>\\n\\n<style>\\n\\tdiv {\\n\\t\\tdisplay: grid;\\n\\t\\theight: 100%;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AA6EC,GAAG,aAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AACb,CAAC"}`
};
var MonthPicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let yearIndex;
  let itemCount;
  let $store, $$unsubscribe_store;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  let grid;
  const get2 = (index2) => ({
    months: Array(12).fill(0).map((d2, i) => {
      const month = (0, import_dayjs.default)(new Date($store.start.getFullYear() + index2, i, 1));
      return {
        year: $store.start.getFullYear() + index2,
        label: month.format("MMM"),
        index: i,
        disabled: !store.isSelectable(month, ["date"])
      };
    })
  });
  const close = () => store.setActiveView("days");
  const add = (amount) => () => {
    store.add(amount, "month", ["date"]);
  };
  const KEY_MAPPINGS = {
    left: add(-1),
    right: add(1),
    up: add(-3),
    down: add(3),
    enter: close,
    escape: close
  };
  $$result.css.add(css$a);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    yearIndex = $store.year - $store.start.getFullYear();
    itemCount = $store.end.getFullYear() - $store.start.getFullYear() + 1;
    $$rendered = `${validate_component(KeyControls, "KeyControls").$$render($$result, Object.assign(KEY_MAPPINGS, { ctx: ["months"] }), {}, {})}
<div class="${"svelte-t161t"}">${validate_component(InfiniteGrid, "InfiniteGrid").$$render($$result, {
      cellCount: 1,
      itemCount,
      get: get2,
      index: yearIndex,
      this: grid
    }, {
      index: ($$value) => {
        yearIndex = $$value;
        $$settled = false;
      },
      this: ($$value) => {
        grid = $$value;
        $$settled = false;
      }
    }, {
      default: ({ months }) => `${validate_component(Grid, "Grid").$$render($$result, {
        template: "repeat(4, 1fr) / repeat(3, 1fr)"
      }, {}, {
        default: () => `${each(months, (month, i) => `<a href="${"#selectMonth"}"${add_classes([
          (month.disabled ? "disabled" : "") + " " + ($store.month === i && $store.year === month.year ? "selected" : "")
        ].join(" ").trim())}>${escape2(month.label)}
				</a>`)}`
      })}`
    })}
</div>`;
  } while (!$$settled);
  $$unsubscribe_store();
  return $$rendered;
});
var css$9 = {
  code: "div.svelte-t161t{display:grid;height:100%}",
  map: `{"version":3,"file":"YearPicker.svelte","sources":["YearPicker.svelte"],"sourcesContent":["<script>\\n\\timport { getContext } from 'svelte';\\n\\timport { storeContextKey } from '../../context';\\n\\timport KeyControls from '../../components/generic/KeyControls.svelte';\\n\\timport Grid from '../../components/generic/Grid.svelte';\\n\\timport InfiniteGrid from '../../components/generic/InfiniteGrid.svelte';\\n\\timport scrollable from '../../directives/scrollable';\\n\\timport { scrollStep } from '../../config/scroll';\\n\\n\\texport let rowCount = 3;\\n\\texport let colCount = 3;\\n\\n\\tconst store = getContext(storeContextKey);\\n\\n\\tconst close = () => store.setActiveView('months');\\n\\tconst add = (amount) => () => {\\n\\t\\tconst result = $store.year + amount;\\n\\t\\tif (result < startYear || result > endYear) return;\\n\\t\\tstore.add(amount, 'year', ['month', 'date']);\\n\\t};\\n\\tconst get = (index) => {\\n\\t\\tconst firstYear = startYear + index * numPerPage;\\n\\t\\treturn {\\n\\t\\t\\tyears: Array(numPerPage)\\n\\t\\t\\t\\t.fill(0)\\n\\t\\t\\t\\t.map((d, i) => ({\\n\\t\\t\\t\\t\\tnumber: firstYear + i,\\n\\t\\t\\t\\t\\tselectable: firstYear + i <= endYear\\n\\t\\t\\t\\t}))\\n\\t\\t};\\n\\t};\\n\\n\\tconst updateIndex = ({ detail: { step: newIndex } }) => {\\n\\t\\tstore.add(numPerPage * (newIndex - yearIndex), 'year', ['year', 'month', 'date']);\\n\\t};\\n\\n\\t$: KEY_MAPPINGS = {\\n\\t\\tup: add(-1 * colCount),\\n\\t\\tdown: add(colCount),\\n\\t\\tleft: add(-1),\\n\\t\\tright: add(1),\\n\\t\\tenter: close,\\n\\t\\tescape: close\\n\\t};\\n\\t$: startYear = $store.start.getFullYear();\\n\\t$: endYear = $store.end.getFullYear();\\n\\t$: numPerPage = rowCount * colCount;\\n\\t$: itemCount = Math.ceil(endYear - startYear + 1) / numPerPage;\\n\\t$: yearIndex = Math.floor(($store.year - startYear) / numPerPage);\\n\\t$: initialY = yearIndex * scrollStep;\\n\\n\\tconst select = (year) => () => {\\n\\t\\tif (!year.selectable) return;\\n\\t\\tstore.setYear(year.number);\\n\\t\\tclose();\\n\\t};\\n<\/script>\\n\\n<KeyControls {...KEY_MAPPINGS} ctx={['years']} />\\n\\n<div use:scrollable={{ y: initialY, step: scrollStep, maxSteps: itemCount }} on:y={updateIndex}>\\n\\t<InfiniteGrid cellCount={1} {itemCount} bind:index={yearIndex} {get} let:years>\\n\\t\\t<Grid template=\\"repeat({rowCount}, 1fr) / repeat({colCount}, 1fr)\\">\\n\\t\\t\\t{#each years as year}\\n\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\thref=\\"#year\\"\\n\\t\\t\\t\\t\\ton:click|preventDefault={select(year)}\\n\\t\\t\\t\\t\\tclass:selected={$store.year === year.number}\\n\\t\\t\\t\\t\\tclass:disabled={!year.selectable}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t{year.number}\\n\\t\\t\\t\\t</a>\\n\\t\\t\\t{/each}\\n\\t\\t</Grid>\\n\\t</InfiniteGrid>\\n</div>\\n\\n<style>\\n\\tdiv {\\n\\t\\tdisplay: grid;\\n\\t\\theight: 100%;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AA8EC,GAAG,aAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,AACb,CAAC"}`
};
var YearPicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let KEY_MAPPINGS;
  let startYear;
  let endYear;
  let numPerPage;
  let itemCount;
  let yearIndex;
  let $store, $$unsubscribe_store;
  let { rowCount = 3 } = $$props;
  let { colCount = 3 } = $$props;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  const close = () => store.setActiveView("months");
  const add = (amount) => () => {
    const result = $store.year + amount;
    if (result < startYear || result > endYear)
      return;
    store.add(amount, "year", ["month", "date"]);
  };
  const get2 = (index2) => {
    const firstYear = startYear + index2 * numPerPage;
    return {
      years: Array(numPerPage).fill(0).map((d2, i) => ({
        number: firstYear + i,
        selectable: firstYear + i <= endYear
      }))
    };
  };
  if ($$props.rowCount === void 0 && $$bindings.rowCount && rowCount !== void 0)
    $$bindings.rowCount(rowCount);
  if ($$props.colCount === void 0 && $$bindings.colCount && colCount !== void 0)
    $$bindings.colCount(colCount);
  $$result.css.add(css$9);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    KEY_MAPPINGS = {
      up: add(-1 * colCount),
      down: add(colCount),
      left: add(-1),
      right: add(1),
      enter: close,
      escape: close
    };
    startYear = $store.start.getFullYear();
    endYear = $store.end.getFullYear();
    numPerPage = rowCount * colCount;
    itemCount = Math.ceil(endYear - startYear + 1) / numPerPage;
    yearIndex = Math.floor(($store.year - startYear) / numPerPage);
    $$rendered = `${validate_component(KeyControls, "KeyControls").$$render($$result, Object.assign(KEY_MAPPINGS, { ctx: ["years"] }), {}, {})}

<div class="${"svelte-t161t"}">${validate_component(InfiniteGrid, "InfiniteGrid").$$render($$result, {
      cellCount: 1,
      itemCount,
      get: get2,
      index: yearIndex
    }, {
      index: ($$value) => {
        yearIndex = $$value;
        $$settled = false;
      }
    }, {
      default: ({ years }) => `${validate_component(Grid, "Grid").$$render($$result, {
        template: "repeat(" + rowCount + ", 1fr) / repeat(" + colCount + ", 1fr)"
      }, {}, {
        default: () => `${each(years, (year) => `<a href="${"#year"}"${add_classes([
          ($store.year === year.number ? "selected" : "") + " " + (!year.selectable ? "disabled" : "")
        ].join(" ").trim())}>${escape2(year.number)}
				</a>`)}`
      })}`
    })}
</div>`;
  } while (!$$settled);
  $$unsubscribe_store();
  return $$rendered;
});
var css$8 = {
  code: ".grid.svelte-126ec0f.svelte-126ec0f{display:grid;width:var(--sc-theme-calendar-width);max-width:var(--sc-theme-calendar-maxWidth);grid-template-rows:auto calc(\n				min(var(--sc-theme-calendar-maxWidth), var(--sc-theme-calendar-width)) * 6 / 7 +\n					var(--sc-theme-calendar-legend-height)\n			);font-family:Rajdhani, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial,\n			sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';box-shadow:var(--sc-theme-calendar-shadow);background:var(--sc-theme-calendar-colors-background-primary);text-align:center;color:var(--sc-theme-calendar-colors-text-primary)}.contents.svelte-126ec0f.svelte-126ec0f{display:grid;overflow:hidden}.grid.svelte-126ec0f .contents.svelte-126ec0f>*{display:grid;grid-row:1;grid-column:1;height:100%;grid-template:1fr / 1fr}",
  map: `{"version":3,"file":"Calendar.svelte","sources":["Calendar.svelte"],"sourcesContent":["<script>\\n\\timport DayPicker from '../../components/calendar/DayPicker.svelte';\\n\\timport ViewTransitionEffect from '../../components/generic/ViewTransitionEffect.svelte';\\n\\timport DatepickerControls from '../../components/calendar/CalendarControls.svelte';\\n\\timport { getContext } from 'svelte';\\n\\timport { storeContextKey } from '../../context';\\n\\timport CrossfadeProvider from '../../components/generic/crossfade/CrossfadeProvider.svelte';\\n\\timport MonthPicker from '../../components/calendar/MonthPicker.svelte';\\n\\timport YearPicker from '../../components/calendar/YearPicker.svelte';\\n\\n\\tconst store = getContext(storeContextKey);\\n<\/script>\\n\\n<CrossfadeProvider let:key let:send let:receive>\\n\\t<div in:receive|local={{ key }} out:send|local={{ key }} class=\\"grid\\">\\n\\t\\t<DatepickerControls />\\n\\t\\t<div class=\\"contents\\">\\n\\t\\t\\t{#if $store.activeView === 'days'}\\n\\t\\t\\t\\t<ViewTransitionEffect>\\n\\t\\t\\t\\t\\t<DayPicker />\\n\\t\\t\\t\\t</ViewTransitionEffect>\\n\\t\\t\\t{:else if $store.activeView === 'months'}\\n\\t\\t\\t\\t<ViewTransitionEffect>\\n\\t\\t\\t\\t\\t<MonthPicker />\\n\\t\\t\\t\\t</ViewTransitionEffect>\\n\\t\\t\\t{:else if $store.activeView === 'years'}\\n\\t\\t\\t\\t<ViewTransitionEffect>\\n\\t\\t\\t\\t\\t<YearPicker />\\n\\t\\t\\t\\t</ViewTransitionEffect>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</div>\\n</CrossfadeProvider>\\n\\n<style>\\n\\t.grid {\\n\\t\\tdisplay: grid;\\n\\t\\twidth: var(--sc-theme-calendar-width);\\n\\t\\tmax-width: var(--sc-theme-calendar-maxWidth);\\n\\t\\tgrid-template-rows: auto calc(\\n\\t\\t\\t\\tmin(var(--sc-theme-calendar-maxWidth), var(--sc-theme-calendar-width)) * 6 / 7 +\\n\\t\\t\\t\\t\\tvar(--sc-theme-calendar-legend-height)\\n\\t\\t\\t);\\n\\t\\tfont-family: Rajdhani, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial,\\n\\t\\t\\tsans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';\\n\\t\\tbox-shadow: var(--sc-theme-calendar-shadow);\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\ttext-align: center;\\n\\t\\tcolor: var(--sc-theme-calendar-colors-text-primary);\\n\\t}\\n\\t.contents {\\n\\t\\tdisplay: grid;\\n\\t\\toverflow: hidden;\\n\\t}\\n\\t.grid .contents > :global(*) {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-row: 1;\\n\\t\\tgrid-column: 1;\\n\\t\\theight: 100%;\\n\\t\\tgrid-template: 1fr / 1fr;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAmCC,KAAK,8BAAC,CAAC,AACN,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,yBAAyB,CAAC,CACrC,SAAS,CAAE,IAAI,4BAA4B,CAAC,CAC5C,kBAAkB,CAAE,IAAI,CAAC;IACvB,IAAI,IAAI,4BAA4B,CAAC,CAAC,CAAC,IAAI,yBAAyB,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;KAC/E,IAAI,iCAAiC,CAAC;IACvC,CACF,WAAW,CAAE,QAAQ,CAAC,CAAC,aAAa,CAAC,CAAC,kBAAkB,CAAC,CAAC,UAAU,CAAC,CAAC,SAAS,CAAC,CAAC,KAAK,CAAC;GACtF,UAAU,CAAC,CAAC,mBAAmB,CAAC,CAAC,gBAAgB,CAAC,CAAC,iBAAiB,CACrE,UAAU,CAAE,IAAI,0BAA0B,CAAC,CAC3C,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,UAAU,CAAE,MAAM,CAClB,KAAK,CAAE,IAAI,uCAAuC,CAAC,AACpD,CAAC,AACD,SAAS,8BAAC,CAAC,AACV,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,MAAM,AACjB,CAAC,AACD,oBAAK,CAAC,wBAAS,CAAW,CAAC,AAAE,CAAC,AAC7B,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,CAAC,CACX,WAAW,CAAE,CAAC,CACd,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAAC,CAAC,CAAC,GAAG,AACzB,CAAC"}`
};
var Calendar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $store, $$unsubscribe_store;
  const store = getContext(storeContextKey);
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  $$result.css.add(css$8);
  $$unsubscribe_store();
  return `${validate_component(CrossfadeProvider, "CrossfadeProvider").$$render($$result, {}, {}, {
    default: ({ key, send, receive }) => `<div class="${"grid svelte-126ec0f"}">${validate_component(CalendarControls, "DatepickerControls").$$render($$result, {}, {}, {})}
		<div class="${"contents svelte-126ec0f"}">${$store.activeView === "days" ? `${validate_component(ViewTransitionEffect, "ViewTransitionEffect").$$render($$result, {}, {}, {
      default: () => `${validate_component(DayPicker, "DayPicker").$$render($$result, {}, {}, {})}`
    })}` : `${$store.activeView === "months" ? `${validate_component(ViewTransitionEffect, "ViewTransitionEffect").$$render($$result, {}, {}, {
      default: () => `${validate_component(MonthPicker, "MonthPicker").$$render($$result, {}, {}, {})}`
    })}` : `${$store.activeView === "years" ? `${validate_component(ViewTransitionEffect, "ViewTransitionEffect").$$render($$result, {}, {}, {
      default: () => `${validate_component(YearPicker, "YearPicker").$$render($$result, {}, {}, {})}`
    })}` : ``}`}`}</div></div>`
  })}`;
});
var calendar = {
  selected: new Date(),
  start: (0, import_dayjs.default)().add(-100, "year").toDate(),
  end: (0, import_dayjs.default)().add(100, "year").toDate(),
  format: "MM/DD/YYYY"
};
var css$7 = {
  code: ".button-container.svelte-18igz6t.svelte-18igz6t{display:grid}.button-container.svelte-18igz6t>.svelte-18igz6t{grid-column:1;grid-row:1;height:100%}button.svelte-18igz6t.svelte-18igz6t{padding:16px 30px;background:var(--sc-theme-calendar-colors-background-primary);color:var(--sc-theme-calendar-colors-text-primary);font-size:1.3em;border-radius:2px;border:0;box-shadow:4px 3px 9px rgb(0 0 0 / 20%);cursor:pointer}.button-text.svelte-18igz6t.svelte-18igz6t{padding:16px 30px;color:var(--sc-theme-calendar-colors-text-primary);font-size:1.3em;cursor:pointer}",
  map: `{"version":3,"file":"Datepicker.svelte","sources":["Datepicker.svelte"],"sourcesContent":["<script>\\n\\timport dayjs from 'dayjs';\\n\\timport datepickerStore from '../stores/datepicker';\\n\\timport { keyControlsContextKey, storeContextKey } from '../context';\\n\\timport { setContext } from 'svelte';\\n\\timport { derived } from 'svelte/store';\\n\\timport Popover from '../components/Popover.svelte';\\n\\timport Theme from '../components/generic/Theme.svelte';\\n\\timport Calendar from '../components/calendar/Calendar.svelte';\\n\\timport { fade } from 'svelte/transition';\\n\\timport { calendar as calendarDefaults } from '../config/defaults';\\n\\n\\texport let selected = calendarDefaults.selected;\\n\\texport let start = calendarDefaults.start;\\n\\texport let end = calendarDefaults.end;\\n\\texport let format = calendarDefaults.format;\\n\\texport let formatted = '';\\n\\texport let theme = {};\\n\\texport let defaultTheme = undefined;\\n\\texport let startOfWeekIndex = 0;\\n\\texport let store = datepickerStore.get({\\n\\t\\tselected,\\n\\t\\tstart,\\n\\t\\tend,\\n\\t\\tshouldEnlargeDay: true,\\n\\t\\tstartOfWeekIndex\\n\\t});\\n\\n\\tsetContext(storeContextKey, store);\\n\\tsetContext(\\n\\t\\tkeyControlsContextKey,\\n\\t\\tderived(store, ($s) => $s.activeView)\\n\\t);\\n\\n\\t$: selected = $store.selected;\\n\\t$: formatted = dayjs(selected).format(format);\\n<\/script>\\n\\n<Theme {defaultTheme} {theme} let:style>\\n\\t<Popover {style} let:key let:send let:receive bind:isOpen={$store.open}>\\n\\t\\t<slot {key} {send} {receive} {formatted}>\\n\\t\\t\\t<div class=\\"button-container\\">\\n\\t\\t\\t\\t<button in:receive|local={{ key }} out:send|local={{ key }} />\\n\\t\\t\\t\\t<span transition:fade|local={{ delay: 150 }} class=\\"button-text\\">{formatted}</span>\\n\\t\\t\\t</div>\\n\\t\\t</slot>\\n\\t\\t<svelte:fragment slot=\\"contents\\">\\n\\t\\t\\t<Calendar />\\n\\t\\t</svelte:fragment>\\n\\t</Popover>\\n</Theme>\\n\\n<style>\\n\\t.button-container {\\n\\t\\tdisplay: grid;\\n\\t}\\n\\t.button-container > * {\\n\\t\\tgrid-column: 1;\\n\\t\\tgrid-row: 1;\\n\\t\\theight: 100%;\\n\\t}\\n\\tbutton {\\n\\t\\tpadding: 16px 30px;\\n\\t\\tbackground: var(--sc-theme-calendar-colors-background-primary);\\n\\t\\tcolor: var(--sc-theme-calendar-colors-text-primary);\\n\\t\\tfont-size: 1.3em;\\n\\t\\tborder-radius: 2px;\\n\\t\\tborder: 0;\\n\\t\\tbox-shadow: 4px 3px 9px rgb(0 0 0 / 20%);\\n\\t\\tcursor: pointer;\\n\\t}\\n\\t.button-text {\\n\\t\\tpadding: 16px 30px;\\n\\t\\tcolor: var(--sc-theme-calendar-colors-text-primary);\\n\\t\\tfont-size: 1.3em;\\n\\t\\tcursor: pointer;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAqDC,iBAAiB,8BAAC,CAAC,AAClB,OAAO,CAAE,IAAI,AACd,CAAC,AACD,gCAAiB,CAAG,eAAE,CAAC,AACtB,WAAW,CAAE,CAAC,CACd,QAAQ,CAAE,CAAC,CACX,MAAM,CAAE,IAAI,AACb,CAAC,AACD,MAAM,8BAAC,CAAC,AACP,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,UAAU,CAAE,IAAI,6CAA6C,CAAC,CAC9D,KAAK,CAAE,IAAI,uCAAuC,CAAC,CACnD,SAAS,CAAE,KAAK,CAChB,aAAa,CAAE,GAAG,CAClB,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACxC,MAAM,CAAE,OAAO,AAChB,CAAC,AACD,YAAY,8BAAC,CAAC,AACb,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,KAAK,CAAE,IAAI,uCAAuC,CAAC,CACnD,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,OAAO,AAChB,CAAC"}`
};
var Datepicker = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $store, $$unsubscribe_store;
  let { selected = calendar.selected } = $$props;
  let { start = calendar.start } = $$props;
  let { end = calendar.end } = $$props;
  let { format: format2 = calendar.format } = $$props;
  let { formatted = "" } = $$props;
  let { theme = {} } = $$props;
  let { defaultTheme = void 0 } = $$props;
  let { startOfWeekIndex = 0 } = $$props;
  let { store = datepickerStore.get({
    selected,
    start,
    end,
    shouldEnlargeDay: true,
    startOfWeekIndex
  }) } = $$props;
  $$unsubscribe_store = subscribe(store, (value) => $store = value);
  setContext(storeContextKey, store);
  setContext(keyControlsContextKey, derived(store, ($s) => $s.activeView));
  if ($$props.selected === void 0 && $$bindings.selected && selected !== void 0)
    $$bindings.selected(selected);
  if ($$props.start === void 0 && $$bindings.start && start !== void 0)
    $$bindings.start(start);
  if ($$props.end === void 0 && $$bindings.end && end !== void 0)
    $$bindings.end(end);
  if ($$props.format === void 0 && $$bindings.format && format2 !== void 0)
    $$bindings.format(format2);
  if ($$props.formatted === void 0 && $$bindings.formatted && formatted !== void 0)
    $$bindings.formatted(formatted);
  if ($$props.theme === void 0 && $$bindings.theme && theme !== void 0)
    $$bindings.theme(theme);
  if ($$props.defaultTheme === void 0 && $$bindings.defaultTheme && defaultTheme !== void 0)
    $$bindings.defaultTheme(defaultTheme);
  if ($$props.startOfWeekIndex === void 0 && $$bindings.startOfWeekIndex && startOfWeekIndex !== void 0)
    $$bindings.startOfWeekIndex(startOfWeekIndex);
  if ($$props.store === void 0 && $$bindings.store && store !== void 0)
    $$bindings.store(store);
  $$result.css.add(css$7);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    selected = $store.selected;
    formatted = (0, import_dayjs.default)(selected).format(format2);
    $$rendered = `${validate_component(Theme, "Theme").$$render($$result, { defaultTheme, theme }, {}, {
      default: ({ style }) => `${validate_component(Popover, "Popover").$$render($$result, { style, isOpen: $store.open }, {
        isOpen: ($$value) => {
          $store.open = $$value;
          $$settled = false;
        }
      }, {
        contents: ({ key, send, receive }) => `${validate_component(Calendar, "Calendar").$$render($$result, {}, {}, {})}
		`,
        default: ({ key, send, receive }) => `${slots.default ? slots.default({ key, send, receive, formatted }) : `
			<div class="${"button-container svelte-18igz6t"}"><button class="${"svelte-18igz6t"}"></button>
				<span class="${"button-text svelte-18igz6t"}">${escape2(formatted)}</span></div>
		`}`
      })}`
    })}`;
  } while (!$$settled);
  $$unsubscribe_store();
  return $$rendered;
});
var css$6 = {
  code: "main.svelte-if4q4w{position:relative;min-height:100vh;margin-top:120px;z-index:3}.container1.svelte-if4q4w{padding:1em;padding-top:2em;padding-bottom:2em;border-radius:10px}.scroller.svelte-if4q4w{width:120%;position:fixed;bottom:-7%;left:-10%;color:white;opacity:0.2;font-size:10rem;font-family:'Thunder Bold';user-select:none;z-index:1}",
  map: `{"version":3,"file":"account.svelte","sources":["account.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, slide } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\timport dayjs from 'dayjs';\\r\\n\\timport { supabase, global_account, global_hasAccount } from '../global';\\r\\n\\timport cryptojs from 'crypto-js';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { Datepicker } from 'svelte-calendar';\\r\\n\\r\\n\\tlet isRegister = true;\\r\\n\\tlet birthdate;\\r\\n\\tlet confirmLogout = false;\\r\\n\\tlet login_email;\\r\\n\\tlet login_password;\\r\\n\\tlet reg_email;\\r\\n\\tlet reg_password;\\r\\n\\tlet reg_givenName;\\r\\n\\tlet reg_familyName;\\r\\n\\tlet reg_gender;\\r\\n\\tlet reg_address;\\r\\n\\r\\n\\tconst theme = {\\r\\n\\t\\tcalendar: {\\r\\n\\t\\t\\twidth: '350px',\\r\\n\\t\\t\\tmaxWidth: '100vw',\\r\\n\\t\\t\\tlegend: {\\r\\n\\t\\t\\t\\theight: '35px'\\r\\n\\t\\t\\t},\\r\\n\\t\\t\\tshadow: 'none',\\r\\n\\t\\t\\tcolors: {\\r\\n\\t\\t\\t\\ttext: {\\r\\n\\t\\t\\t\\t\\tprimary: '#eee',\\r\\n\\t\\t\\t\\t\\thighlight: '#fff'\\r\\n\\t\\t\\t\\t},\\r\\n\\t\\t\\t\\tbackground: {\\r\\n\\t\\t\\t\\t\\tprimary: '#1B1B1B',\\r\\n\\t\\t\\t\\t\\thighlight: '#EB6F95',\\r\\n\\t\\t\\t\\t\\thover: '#263238'\\r\\n\\t\\t\\t\\t},\\r\\n\\t\\t\\t\\tborder: '#222'\\r\\n\\t\\t\\t},\\r\\n\\t\\t\\tfont: {\\r\\n\\t\\t\\t\\tregular: '1.5em',\\r\\n\\t\\t\\t\\tlarge: '5em'\\r\\n\\t\\t\\t},\\r\\n\\t\\t\\tgrid: {\\r\\n\\t\\t\\t\\tdisabledOpacity: '.5',\\r\\n\\t\\t\\t\\toutsiderOpacity: '.2'\\r\\n\\t\\t\\t}\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tconst toggleCards = (e) => {\\r\\n\\t\\tisRegister ? (isRegister = false) : (isRegister = true);\\r\\n\\t};\\r\\n\\r\\n\\tconst login_emailPass = async (e) => {\\r\\n\\t\\tconst { data, error } = await supabase\\r\\n\\t\\t\\t.from('users')\\r\\n\\t\\t\\t.select('*')\\r\\n\\t\\t\\t.eq('email', login_email)\\r\\n\\t\\t\\t.eq('password', login_password);\\r\\n\\t\\tif (!error) {\\r\\n\\t\\t\\tdelete data[0].password;\\r\\n\\t\\t\\tglobal_account.set(data[0]);\\r\\n\\t\\t\\tlocalStorage.setItem('data', JSON.stringify(data[0]));\\r\\n\\t\\t\\t// M.toast({ html: \`Hello, \${$global_account.given_name} \${$global_account.family_name}\` });\\r\\n\\t\\t} else {\\r\\n\\t\\t\\t// M.toast({ html: \`Email or Password incorrect.\` });\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tconst registerUser = async (e) => {\\r\\n\\t\\tif (reg_email != '') {\\r\\n\\t\\t\\tconst { data, error } = await supabase.from('users').insert([\\r\\n\\t\\t\\t\\t{\\r\\n\\t\\t\\t\\t\\tgiven_name: reg_givenName,\\r\\n\\t\\t\\t\\t\\tfamily_name: reg_familyName,\\r\\n\\t\\t\\t\\t\\temail: reg_email,\\r\\n\\t\\t\\t\\t\\tpassword: reg_password,\\r\\n\\t\\t\\t\\t\\tbirthdate: dayjs($birthdate.selected).format('YYYY-MM-DD'),\\r\\n\\t\\t\\t\\t\\tgender: reg_gender,\\r\\n\\t\\t\\t\\t\\tshipping_address: reg_address\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t]);\\r\\n\\r\\n\\t\\t\\tif (error) {\\r\\n\\t\\t\\t\\t// M.toast({ html: 'Something went wrong. Try again' });\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\tlogin_email = reg_email;\\r\\n\\t\\t\\t\\tisRegister = false;\\r\\n\\t\\t\\t\\treg_gender = null;\\r\\n\\t\\t\\t\\treg_givenName = null;\\r\\n\\t\\t\\t\\treg_familyName = null;\\r\\n\\t\\t\\t\\treg_password = null;\\r\\n\\t\\t\\t\\treg_email = null;\\r\\n\\t\\t\\t\\t// $birthdate.set(null);\\r\\n\\t\\t\\t\\t// M.toast({ html: 'Registration Successful, please login ' });\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\t// M.toast({ html: 'Please enter all required fields' });\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tconst logout = (e) => {\\r\\n\\t\\tlogin_email = '';\\r\\n\\t\\tlogin_password = '';\\r\\n\\t\\tglobal_account.set(null);\\r\\n\\t\\tlocalStorage.setItem('data', '');\\r\\n\\t\\tconfirmLogout = false;\\r\\n\\t};\\r\\n\\tconst logoutConfirm = (e) => {\\r\\n\\t\\tif (confirmLogout) {\\r\\n\\t\\t\\tconfirmLogout = false;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tconfirmLogout = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount((e) => {\\r\\n\\t\\tlet data = localStorage.getItem('data');\\r\\n\\t\\tif (data) {\\r\\n\\t\\t\\tglobal_account.set(JSON.parse(data));\\r\\n\\t\\t\\tglobal_hasAccount.set(true);\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tglobal_account.set(null);\\r\\n\\t\\t\\tglobal_hasAccount.set(false);\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>\\r\\n\\t<!-- {#if !isRegister} -->\\r\\n\\r\\n\\t<div\\r\\n\\t\\tclass=\\"container text-white\\"\\r\\n\\t\\tstyle=\\"border-radius:10px\\"\\r\\n\\t\\ttransition:slide|local={{ duration: 500 }}\\r\\n\\t>\\r\\n\\t\\t<p class=\\"display-3\\">Your Account</p>\\r\\n\\t\\t{#if !$global_account}\\r\\n\\t\\t\\t<!-- <div class=\\"row container1 center-align \\" in:fly|local={{ y: -40, duration: 500 }}>\\r\\n\\t\\t\\t\\t<div class=\\"col s12 m5 \\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"imageContainer\\">\\r\\n\\t\\t\\t\\t\\t\\t<img src=\\"./illustrations/undraw_profile_image_re_ic2f.svg\\" width=\\"250\\" alt=\\"\\" />\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"col s12 m7 container1 blue-grey darken-4 z-depth-1\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"\\">\\r\\n\\t\\t\\t\\t\\t\\t<h4>Sign in to your account</h4>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"input-field col s12 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">email</i>\\r\\n\\t\\t\\t\\t\\t\\t<input id=\\"email\\" bind:value={login_email} type=\\"email\\" class=\\"validate  white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"email\\">Email Address</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"input-field col s12 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">password</i>\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={login_password}\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"validate  white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"password\\">Password</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={login_emailPass}\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"waves-effect waves-light btn-large pink darken-4 \\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>Sign In<i class=\\"material-icons right\\">east</i></button\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"row center-align\\" in:fly|local={{ y: -40, duration: 500, delay: 200 }}>\\r\\n\\t\\t\\t\\t{#if !isRegister}\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 blue-grey darken-3 z-depth-1\\" style=\\"border-radius: 10px;\\">\\r\\n\\t\\t\\t\\t\\t\\t<p on:click={toggleCards} style=\\"cursor:pointer;\\">Don't have an account? Click Me</p>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div> -->\\r\\n\\r\\n\\t\\t\\t<div class=\\"row\\" style=\\"min-height: 50vh;\\" in:fly|local={{ y: -40, duration: 500 }}>\\r\\n\\t\\t\\t\\t<div class=\\"col-md-6 d-flex justify-content-center align-items-center mt-md-5\\">\\r\\n\\t\\t\\t\\t\\t<img\\r\\n\\t\\t\\t\\t\\t\\tclass=\\"mx-auto\\"\\r\\n\\t\\t\\t\\t\\t\\tsrc=\\"./illustrations/undraw_profile_image_re_ic2f.svg\\"\\r\\n\\t\\t\\t\\t\\t\\twidth=\\"250\\"\\r\\n\\t\\t\\t\\t\\t\\talt=\\"\\"\\r\\n\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"col-md-6 d-flex flex-column justify-content-center mt-md-5\\">\\r\\n\\t\\t\\t\\t\\t<h4>Sign in to your account</h4>\\r\\n\\r\\n\\t\\t\\t\\t\\t<div class=\\"form-floating my-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"login_email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Registered Email Address\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={login_email}\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"login_email\\">Your Registered Email Address</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"form-floating mb-4 \\">\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"login_password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={login_password}\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"login_password\\">Your Password</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<button class=\\"btn btn-primary\\" on:click={login_emailPass}> Sign In </button>\\r\\n\\t\\t\\t\\t\\t<button on:click={toggleCards} class=\\"btn btn-link mt-3 text-info\\"\\r\\n\\t\\t\\t\\t\\t\\t>Don't have an account? Click Me</button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t{#if isRegister}\\r\\n\\t\\t\\t\\t<!-- <div\\r\\n\\t\\t\\t\\t\\tclass=\\"container1 white-text blue-grey darken-4 z-depth-1\\"\\r\\n\\t\\t\\t\\t\\tstyle=\\"border-radius:10px\\"\\r\\n\\t\\t\\t\\t\\ttransition:slide|local={{ duration: 500 }}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"container\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<h4>Join with us</h4>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>User Account</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 m6 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_email}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"white-text validate\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_email\\">Your Email Adress</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 m6 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_password}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_password\\">Your Password</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Basic Information</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 m6 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input bind:value={reg_givenName} id=\\"given_name\\" type=\\"text\\" class=\\"white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"given_name\\">Your Given Name</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 m6 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input bind:value={reg_familyName} id=\\"family_name\\" type=\\"text\\" class=\\"white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"family_name\\">Your Family Name</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 white-text valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<label style=\\"font-size: 1em; margin-right: 1em;\\" for=\\"\\">Birth Date</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input id=\\"phoneNumber\\" type=\\"number\\" min=\\"1900\\" max=\\"2009\\" class=\\"white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"phoneNumber\\">Phone Number</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 m5 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"with-gap\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"male\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"group1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>Male</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"with-gap\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"female\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"group1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>Female</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"with-gap\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tvalue=\\"nonBinary\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"group1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>Non-binary</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field col s12 white-text\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<input id=\\"shipAddress\\" bind:value={reg_address} type=\\"text\\" class=\\"white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"shipAddress\\">Shipping Address</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={registerUser}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"waves-effect waves-light btn-large deep-orange darken-4 \\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t>Register<i class=\\"material-icons right\\">person_add</i></button\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row\\" />\\r\\n\\t\\t\\t\\t</div> -->\\r\\n\\r\\n\\t\\t\\t\\t<div class=\\"row my-5\\" transition:slide|local={{ duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-12\\">\\r\\n\\t\\t\\t\\t\\t\\t<h4>Join with us</h4>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-12 mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t<h5>User Account</h5>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_email\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"username@domain.com\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_email}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_email\\">Your Email address</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Secure Password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_password}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_password\\">Your Password</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col col-sm-12 mt-4\\">\\r\\n\\t\\t\\t\\t\\t\\t<h5>Basic Information</h5>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_givenName\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Given Name\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_givenName}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_givenName\\">Your Given Name</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_familyName\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Surname\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_familyName}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_familyName\\">Your Surname</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_address\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Shipping Addresse\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:value={reg_address}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_address\\">Your Shipping Address</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6 mb-4\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<h5 class=\\"me-4\\">Birthdate</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<Datepicker {theme} bind:store={birthdate} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<!-- <p class=\\"ms-4\\">{dayjs($birthdate?.selected).format('MM/DD/YYYY')}</p> -->\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col-sm-12 col-md-6 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div><h5>Gender</h5></div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender1\\"> Male </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender2\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender2\\"> Female </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-check\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tbind:group={reg_gender}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-check-input\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"radio\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname=\\"reg_gender\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_gender3\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label class=\\"form-check-label\\" for=\\"reg_gender3\\"> Non-binary </label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<!-- <div class=\\"col-sm-12 col-md-6\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"form-floating mb-3 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"number\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"form-control bg-transparent\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tid=\\"reg_givenName\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplaceholder=\\"Your Given Name\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<label for=\\"reg_givenName\\">Your Given Name</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div> -->\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<button on:click={registerUser} class=\\"btn btn-outline-primary mt-5\\">\\r\\n\\t\\t\\t\\t\\t\\tRegister Now\\r\\n\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t{/if}\\r\\n\\r\\n\\t\\t{#if $global_account}\\r\\n\\t\\t\\t<div class=\\"row pink darken-4 container1\\" style=\\"margin-top: 5em;\\">\\r\\n\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Account ID:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>{$global_account.id.toUpperCase()}</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Account Holder:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>{$global_account.given_name} {$global_account.family_name}</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Account Email:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>{$global_account.email}</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\" style=\\"margin-top: 4em;\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Birthdate:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\" />\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Gender:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>{$global_account.gender.toUpperCase()}</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"row valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m3\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>Shipping Address:</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12 m9\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h6>{$global_account.shipping_address}</h6>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"row\\" style=\\"margin-top: 5em;\\" in:fly|local={{ y: -40, duration: 500 }}>\\r\\n\\t\\t\\t\\t{#if !confirmLogout}\\r\\n\\t\\t\\t\\t\\t<div class=\\"row center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t<div\\r\\n\\t\\t\\t\\t\\t\\t\\tin:fly|local={{ y: -20, duration: 500 }}\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={logoutConfirm}\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-large waves-effect waves-light red lighten-1 right\\"\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\tLog Out\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t<div class=\\"row right-align\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s2 offset-s8\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={logout}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tin:fly|local={{ x: 20, duration: 500, delay: 400 }}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-large waves-effect waves-light red lighten-1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tYes\\r\\n\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s2 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={logoutConfirm}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tin:fly|local={{ x: 20, duration: 500, delay: 200 }}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn btn-large waves-effect waves-light blue lighten-1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tNo\\r\\n\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h4 in:fly|local={{ x: 20, duration: 500 }}>Do you really want to logout?</h4>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t{/if}\\r\\n\\r\\n\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t<div class=\\"col\\" />\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t>BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;</MarqueeTextWidget\\r\\n\\t>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.container1 {\\r\\n\\t\\tpadding: 1em;\\r\\n\\t\\tpadding-top: 2em;\\r\\n\\t\\tpadding-bottom: 2em;\\r\\n\\t\\tborder-radius: 10px;\\r\\n\\t}\\r\\n\\t.scroller {\\r\\n\\t\\twidth: 120%;\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\tbottom: -7%;\\r\\n\\t\\tleft: -10%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t\\tfont-size: 10rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAujBC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,WAAW,cAAC,CAAC,AACZ,OAAO,CAAE,GAAG,CACZ,WAAW,CAAE,GAAG,CAChB,cAAc,CAAE,GAAG,CACnB,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,SAAS,cAAC,CAAC,AACV,KAAK,CAAE,IAAI,CACX,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Account = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $global_account, $$unsubscribe_global_account;
  $$unsubscribe_global_account = subscribe(global_account, (value) => $global_account = value);
  let birthdate;
  let login_email;
  let login_password;
  let reg_email;
  let reg_password;
  let reg_givenName;
  let reg_familyName;
  let reg_address;
  const theme = {
    calendar: {
      width: "350px",
      maxWidth: "100vw",
      legend: { height: "35px" },
      shadow: "none",
      colors: {
        text: { primary: "#eee", highlight: "#fff" },
        background: {
          primary: "#1B1B1B",
          highlight: "#EB6F95",
          hover: "#263238"
        },
        border: "#222"
      },
      font: { regular: "1.5em", large: "5em" },
      grid: {
        disabledOpacity: ".5",
        outsiderOpacity: ".2"
      }
    }
  };
  $$result.css.add(css$6);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<main class="${"svelte-if4q4w"}">

	<div class="${"container text-white"}" style="${"border-radius:10px"}"><p class="${"display-3"}">Your Account</p>
		${!$global_account ? `

			<div class="${"row"}" style="${"min-height: 50vh;"}"><div class="${"col-md-6 d-flex justify-content-center align-items-center mt-md-5"}"><img class="${"mx-auto"}" src="${"./illustrations/undraw_profile_image_re_ic2f.svg"}" width="${"250"}" alt="${""}"></div>
				<div class="${"col-md-6 d-flex flex-column justify-content-center mt-md-5"}"><h4>Sign in to your account</h4>

					<div class="${"form-floating my-3 "}"><input type="${"email"}" class="${"form-control bg-transparent"}" id="${"login_email"}" placeholder="${"Your Registered Email Address"}"${add_attribute("value", login_email, 0)}>
						<label for="${"login_email"}">Your Registered Email Address</label></div>
					<div class="${"form-floating mb-4 "}"><input type="${"password"}" class="${"form-control bg-transparent"}" id="${"login_password"}" placeholder="${"Your Password"}"${add_attribute("value", login_password, 0)}>
						<label for="${"login_password"}">Your Password</label></div>
					<button class="${"btn btn-primary"}">Sign In </button>
					<button class="${"btn btn-link mt-3 text-info"}">Don&#39;t have an account? Click Me</button></div></div>

			${`

				<div class="${"row my-5"}"><div class="${"col col-12"}"><h4>Join with us</h4></div>
					<div class="${"col col-12 mt-4"}"><h5>User Account</h5>
						<div class="${"row"}"><div class="${"col-sm-12 col-md-6"}"><div class="${"form-floating mb-3 "}"><input type="${"email"}" class="${"form-control bg-transparent"}" id="${"reg_email"}" placeholder="${"username@domain.com"}"${add_attribute("value", reg_email, 0)}>
									<label for="${"reg_email"}">Your Email address</label></div></div>
							<div class="${"col col-md-6"}"><div class="${"form-floating mb-3 "}"><input type="${"password"}" class="${"form-control bg-transparent"}" id="${"reg_password"}" placeholder="${"Your Secure Password"}"${add_attribute("value", reg_password, 0)}>
									<label for="${"reg_password"}">Your Password</label></div></div></div></div>
					<div class="${"col col-sm-12 mt-4"}"><h5>Basic Information</h5>
						<div class="${"row"}"><div class="${"col-sm-12 col-md-6"}"><div class="${"form-floating mb-3 "}"><input type="${"text"}" class="${"form-control bg-transparent"}" id="${"reg_givenName"}" placeholder="${"Your Given Name"}"${add_attribute("value", reg_givenName, 0)}>
									<label for="${"reg_givenName"}">Your Given Name</label></div></div>
							<div class="${"col-sm-12 col-md-6"}"><div class="${"form-floating mb-3 "}"><input type="${"text"}" class="${"form-control bg-transparent"}" id="${"reg_familyName"}" placeholder="${"Your Surname"}"${add_attribute("value", reg_familyName, 0)}>
									<label for="${"reg_familyName"}">Your Surname</label></div></div>
							<div class="${"col-sm-12"}"><div class="${"form-floating mb-3 "}"><input type="${"text"}" class="${"form-control bg-transparent"}" id="${"reg_address"}" placeholder="${"Your Shipping Addresse"}"${add_attribute("value", reg_address, 0)}>
									<label for="${"reg_address"}">Your Shipping Address</label></div></div>
							<div class="${"col-sm-12 col-md-6 mb-4"}"><h5 class="${"me-4"}">Birthdate</h5>
								${validate_component(Datepicker, "Datepicker").$$render($$result, { theme, store: birthdate }, {
      store: ($$value) => {
        birthdate = $$value;
        $$settled = false;
      }
    }, {})}
								</div>
							<div class="${"col-sm-12 col-md-6 "}"><div><h5>Gender</h5></div>
								<div class="${"form-check"}"><input class="${"form-check-input"}" type="${"radio"}" name="${"reg_gender"}" id="${"reg_gender1"}">
									<label class="${"form-check-label"}" for="${"reg_gender1"}">Male </label></div>
								<div class="${"form-check"}"><input class="${"form-check-input"}" type="${"radio"}" name="${"reg_gender"}" id="${"reg_gender2"}">
									<label class="${"form-check-label"}" for="${"reg_gender2"}">Female </label></div>
								<div class="${"form-check"}"><input class="${"form-check-input"}" type="${"radio"}" name="${"reg_gender"}" id="${"reg_gender3"}">
									<label class="${"form-check-label"}" for="${"reg_gender3"}">Non-binary </label></div></div>
							</div></div>
					<button class="${"btn btn-outline-primary mt-5"}">Register Now
					</button></div>`}` : ``}

		${$global_account ? `<div class="${"row pink darken-4 container1 svelte-if4q4w"}" style="${"margin-top: 5em;"}"><div class="${"col s12"}"><div class="${"row valign-wrapper"}"><div class="${"col s12 m3"}"><h6>Account ID:</h6></div>
						<div class="${"col s12 m9"}"><h6>${escape2($global_account.id.toUpperCase())}</h6></div></div>
					<div class="${"row valign-wrapper"}"><div class="${"col s12 m3"}"><h6>Account Holder:</h6></div>
						<div class="${"col s12 m9"}"><h6>${escape2($global_account.given_name)} ${escape2($global_account.family_name)}</h6></div></div>
					<div class="${"row valign-wrapper"}"><div class="${"col s12 m3"}"><h6>Account Email:</h6></div>
						<div class="${"col s12 m9"}"><h6>${escape2($global_account.email)}</h6></div></div>
					<div class="${"row valign-wrapper"}" style="${"margin-top: 4em;"}"><div class="${"col s12 m3"}"><h6>Birthdate:</h6></div>
						<div class="${"col s12 m9"}"></div></div>
					<div class="${"row valign-wrapper"}"><div class="${"col s12 m3"}"><h6>Gender:</h6></div>
						<div class="${"col s12 m9"}"><h6>${escape2($global_account.gender.toUpperCase())}</h6></div></div>
					<div class="${"row valign-wrapper"}"><div class="${"col s12 m3"}"><h6>Shipping Address:</h6></div>
						<div class="${"col s12 m9"}"><h6>${escape2($global_account.shipping_address)}</h6></div></div></div></div>
			<div class="${"row"}" style="${"margin-top: 5em;"}">${`<div class="${"row center-align"}"><div class="${"btn btn-large waves-effect waves-light red lighten-1 right"}">Log Out
						</div></div>`}</div>` : ``}

		<div class="${"row"}"><div class="${"col"}"></div></div></div></main>
<div class="${"scroller svelte-if4q4w"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
      default: () => `BE ACTIVE WITH ABIE G \xA0BE ACTIVE WITH ABIE G \xA0BE ACTIVE WITH ABIE G \xA0`
    })}
</div>`;
  } while (!$$settled);
  $$unsubscribe_global_account();
  return $$rendered;
});
var account = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Account
});
var css$5 = {
  code: "main.svelte-49c1mn{position:relative;min-height:100vh;margin-top:120px;z-index:3}.container1.svelte-49c1mn{padding:1em;border-radius:10px}.scroller.svelte-49c1mn{position:fixed;bottom:-7%;left:-10%;color:white;opacity:0.2;font-size:10rem;font-family:'Thunder Bold';user-select:none;z-index:1}",
  map: `{"version":3,"file":"contact.svelte","sources":["contact.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>\\r\\n\\t<div class=\\"container white-text\\">\\r\\n\\t\\t<h2>Keep in touch</h2>\\r\\n\\t\\t<div class=\\"container1 blue-grey darken-4\\">\\r\\n\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t<div class=\\"col\\">\\r\\n\\t\\t\\t\\t\\t<h5>Write your thoughts</h5>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t<div class=\\"input-field col s12 m6 white-text\\">\\r\\n\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">email</i>\\r\\n\\t\\t\\t\\t\\t<input id=\\"email\\" type=\\"text\\" class=\\"validate  white-text\\" />\\r\\n\\t\\t\\t\\t\\t<label for=\\"email\\">Email Address</label>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"input-field col s12 white-text\\">\\r\\n\\t\\t\\t\\t\\t<textarea id=\\"textarea1\\" class=\\"materialize-textarea white-text\\" />\\r\\n\\t\\t\\t\\t\\t<label for=\\"textarea1\\">Your thoughts here</label>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"row center-align\\">\\r\\n\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t<button class=\\"waves-effect waves-light btn-large pink darken-4 \\"\\r\\n\\t\\t\\t\\t\\t\\t>Send some thoughts<i class=\\"material-icons right\\">send</i></button\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t>KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;</MarqueeTextWidget\\r\\n\\t>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\r\\n\\t.container1 {\\r\\n\\t\\tpadding: 1em;\\r\\n\\t\\tborder-radius: 10px;\\r\\n\\t}\\r\\n\\t.scroller {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\tbottom: -7%;\\r\\n\\t\\tleft: -10%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t\\tfont-size: 10rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA0CC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AAED,WAAW,cAAC,CAAC,AACZ,OAAO,CAAE,GAAG,CACZ,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,SAAS,cAAC,CAAC,AACV,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Contact = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$5);
  return `<main class="${"svelte-49c1mn"}"><div class="${"container white-text"}"><h2>Keep in touch</h2>
		<div class="${"container1 blue-grey darken-4 svelte-49c1mn"}"><div class="${"row"}"><div class="${"col"}"><h5>Write your thoughts</h5></div></div>
			<div class="${"row"}"><div class="${"input-field col s12 m6 white-text"}"><i class="${"material-icons prefix"}">email</i>
					<input id="${"email"}" type="${"text"}" class="${"validate white-text"}">
					<label for="${"email"}">Email Address</label></div>
				<div class="${"input-field col s12 white-text"}"><textarea id="${"textarea1"}" class="${"materialize-textarea white-text"}"></textarea>
					<label for="${"textarea1"}">Your thoughts here</label></div></div>
			<div class="${"row center-align"}"><div class="${"col s12"}"><button class="${"waves-effect waves-light btn-large pink darken-4 "}">Send some thoughts<i class="${"material-icons right"}">send</i></button></div></div></div></div></main>
<div class="${"scroller svelte-49c1mn"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `KEEP IN TOUCH \xA0KEEP IN TOUCH \xA0KEEP IN TOUCH \xA0`
  })}
</div>`;
});
var contact = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Contact
});
var css$4 = {
  code: "main.svelte-xhios2.svelte-xhios2{position:relative;min-height:100vh;margin-top:120px;z-index:3}.devCard.svelte-xhios2.svelte-xhios2{cursor:default;position:relative;margin-bottom:10em;transition:200ms ease all}.devCard.svelte-xhios2 h5.svelte-xhios2{font-family:'Thunder Light';font-size:4em;margin:0;text-align:center}.devCard.svelte-xhios2 p.svelte-xhios2{font-family:'Thunder Bold';font-size:1.5em;margin:0;text-align:center}.devCard.svelte-xhios2.svelte-xhios2::before{content:'';opacity:0;background:black;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:50vw;height:350px;z-index:-1;transition:200ms ease all;border-radius:10px}.devCard.svelte-xhios2.svelte-xhios2:hover::before{opacity:0.5}@media screen and (max-width: 1000px){.devCard.svelte-xhios2.svelte-xhios2::before{width:100vw}}.devCard_gerald.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_gab.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_trizh.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_miks.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_carlo.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_kevin.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.devCard_edz.svelte-xhios2.svelte-xhios2::before{background:url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg');background-position:center;background-size:cover;background-repeat:no-repeat}.scroller.svelte-xhios2.svelte-xhios2{position:fixed;bottom:-7%;left:-10%;color:white;opacity:0.2;font-size:10rem;font-family:'Thunder Bold';user-select:none;z-index:1}",
  map: `{"version":3,"file":"about.svelte","sources":["about.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n<\/script>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>\\r\\n\\t<div class=\\"container white-text\\" style=\\"margin-top: 10em; margin-bottom: 100px\\">\\r\\n\\t\\t<h2>Hi!</h2>\\r\\n\\t\\t<p>\\r\\n\\t\\t\\tThe website is a project by BSCS3A students from University of Caloocan City - Congress Campus\\r\\n\\t\\t\\tto fulfill the requirement on Advanced Web Systems and is created solely for academic purposes\\r\\n\\t\\t\\tonly.\\r\\n\\t\\t</p>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container white-text\\" style=\\"margin-top: 10em; margin-bottom: 100px\\">\\r\\n\\t\\t<h2>What made this site?</h2>\\r\\n\\t\\t<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>\\r\\n\\t\\t<p>Hosted in Vercel</p>\\r\\n\\t\\t<p>And supported by Supabase</p>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container white-text\\" style=\\"margin-top: 100px;\\">\\r\\n\\t\\t<h2>About the Team</h2>\\r\\n\\t\\t<div class=\\"row\\" style=\\"margin-top:10em;\\">\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_gerald\\">\\r\\n\\t\\t\\t\\t<h5>Gerald Chavez</h5>\\r\\n\\t\\t\\t\\t<p>Lead Developer</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_gab\\">\\r\\n\\t\\t\\t\\t<h5>Gabrielle Napoto</h5>\\r\\n\\t\\t\\t\\t<p>Content Manager and Designer / Abie G</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_trizh\\">\\r\\n\\t\\t\\t\\t<h5>Trizhalyn Maglangit</h5>\\r\\n\\t\\t\\t\\t<p>Content Manager and Designer</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_miks\\">\\r\\n\\t\\t\\t\\t<h5>Mikkie Gregorio</h5>\\r\\n\\t\\t\\t\\t<p>Content Manager and Designer</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_carlo\\">\\r\\n\\t\\t\\t\\t<h5>Carlo Diaz</h5>\\r\\n\\t\\t\\t\\t<p>Quality Testing and Assurance</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_kevin\\">\\r\\n\\t\\t\\t\\t<h5>Kevin Corpin</h5>\\r\\n\\t\\t\\t\\t<p>Quality Testing and Assurance</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12 devCard devCard_edz\\">\\r\\n\\t\\t\\t\\t<h5>Edriane Barcita</h5>\\r\\n\\t\\t\\t\\t<p>Server Hosting and Maintenance</p>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t<MarqueeTextWidget duration={10}>WHO MADE THIS SITE? &nbsp;</MarqueeTextWidget>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\r\\n\\t.devCard {\\r\\n\\t\\tcursor: default;\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmargin-bottom: 10em;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t}\\r\\n\\t.devCard h5 {\\r\\n\\t\\tfont-family: 'Thunder Light';\\r\\n\\t\\tfont-size: 4em;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\t.devCard p {\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tfont-size: 1.5em;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\t.devCard::before {\\r\\n\\t\\tcontent: '';\\r\\n\\t\\topacity: 0;\\r\\n\\t\\tbackground: black;\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 50%;\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\ttransform: translate(-50%, -50%);\\r\\n\\t\\t/* border-radius: 100%; */\\r\\n\\t\\twidth: 50vw;\\r\\n\\t\\theight: 350px;\\r\\n\\t\\tz-index: -1;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t\\tborder-radius: 10px;\\r\\n\\t}\\r\\n\\t.devCard:hover::before {\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\t@media screen and (max-width: 1000px) {\\r\\n\\t\\t.devCard::before {\\r\\n\\t\\t\\twidth: 100vw;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t.devCard_gerald::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_gab::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_trizh::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_miks::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_carlo::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_kevin::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\t.devCard_edz::before {\\r\\n\\t\\tbackground: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg');\\r\\n\\t\\tbackground-position: center;\\r\\n\\t\\tbackground-size: cover;\\r\\n\\t\\tbackground-repeat: no-repeat;\\r\\n\\t}\\r\\n\\r\\n\\t.scroller {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\tbottom: -7%;\\r\\n\\t\\tleft: -10%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t\\tfont-size: 10rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA2DC,IAAI,4BAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AAED,QAAQ,4BAAC,CAAC,AACT,MAAM,CAAE,OAAO,CACf,QAAQ,CAAE,QAAQ,CAClB,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,sBAAQ,CAAC,EAAE,cAAC,CAAC,AACZ,WAAW,CAAE,eAAe,CAC5B,SAAS,CAAE,GAAG,CACd,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,MAAM,AACnB,CAAC,AACD,sBAAQ,CAAC,CAAC,cAAC,CAAC,AACX,WAAW,CAAE,cAAc,CAC3B,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,MAAM,AACnB,CAAC,AACD,oCAAQ,QAAQ,AAAC,CAAC,AACjB,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,KAAK,CACjB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,SAAS,CAAE,UAAU,IAAI,CAAC,CAAC,IAAI,CAAC,CAEhC,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,CAC1B,aAAa,CAAE,IAAI,AACpB,CAAC,AACD,oCAAQ,MAAM,QAAQ,AAAC,CAAC,AACvB,OAAO,CAAE,GAAG,AACb,CAAC,AACD,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,MAAM,CAAC,AAAC,CAAC,AACtC,oCAAQ,QAAQ,AAAC,CAAC,AACjB,KAAK,CAAE,KAAK,AACb,CAAC,AACF,CAAC,AAED,2CAAe,QAAQ,AAAC,CAAC,AACxB,UAAU,CAAE,IAAI,gGAAgG,CAAC,CACjH,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,wCAAY,QAAQ,AAAC,CAAC,AACrB,UAAU,CAAE,IAAI,6FAA6F,CAAC,CAC9G,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,0CAAc,QAAQ,AAAC,CAAC,AACvB,UAAU,CAAE,IAAI,+FAA+F,CAAC,CAChH,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,yCAAa,QAAQ,AAAC,CAAC,AACtB,UAAU,CAAE,IAAI,8FAA8F,CAAC,CAC/G,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,0CAAc,QAAQ,AAAC,CAAC,AACvB,UAAU,CAAE,IAAI,+FAA+F,CAAC,CAChH,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,0CAAc,QAAQ,AAAC,CAAC,AACvB,UAAU,CAAE,IAAI,+FAA+F,CAAC,CAChH,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AACD,wCAAY,QAAQ,AAAC,CAAC,AACrB,UAAU,CAAE,IAAI,6FAA6F,CAAC,CAC9G,mBAAmB,CAAE,MAAM,CAC3B,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,SAAS,AAC7B,CAAC,AAED,SAAS,4BAAC,CAAC,AACV,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<main class="${"svelte-xhios2"}"><div class="${"container white-text"}" style="${"margin-top: 10em; margin-bottom: 100px"}"><h2>Hi!</h2>
		<p>The website is a project by BSCS3A students from University of Caloocan City - Congress Campus
			to fulfill the requirement on Advanced Web Systems and is created solely for academic purposes
			only.
		</p></div>
	<div class="${"container white-text"}" style="${"margin-top: 10em; margin-bottom: 100px"}"><h2>What made this site?</h2>
		<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
		<p>Hosted in Vercel</p>
		<p>And supported by Supabase</p></div>
	<div class="${"container white-text"}" style="${"margin-top: 100px;"}"><h2>About the Team</h2>
		<div class="${"row"}" style="${"margin-top:10em;"}"><div class="${"col s12 devCard devCard_gerald svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Gerald Chavez</h5>
				<p class="${"svelte-xhios2"}">Lead Developer</p></div>
			<div class="${"col s12 devCard devCard_gab svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Gabrielle Napoto</h5>
				<p class="${"svelte-xhios2"}">Content Manager and Designer / Abie G</p></div>
			<div class="${"col s12 devCard devCard_trizh svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Trizhalyn Maglangit</h5>
				<p class="${"svelte-xhios2"}">Content Manager and Designer</p></div>
			<div class="${"col s12 devCard devCard_miks svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Mikkie Gregorio</h5>
				<p class="${"svelte-xhios2"}">Content Manager and Designer</p></div>
			<div class="${"col s12 devCard devCard_carlo svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Carlo Diaz</h5>
				<p class="${"svelte-xhios2"}">Quality Testing and Assurance</p></div>
			<div class="${"col s12 devCard devCard_kevin svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Kevin Corpin</h5>
				<p class="${"svelte-xhios2"}">Quality Testing and Assurance</p></div>
			<div class="${"col s12 devCard devCard_edz svelte-xhios2"}"><h5 class="${"svelte-xhios2"}">Edriane Barcita</h5>
				<p class="${"svelte-xhios2"}">Server Hosting and Maintenance</p></div></div></div></main>
<div class="${"scroller svelte-xhios2"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 10 }, {}, { default: () => `WHO MADE THIS SITE? \xA0` })}
</div>`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": About
});
var css$3 = {
  code: "main.svelte-lwtd15{position:relative;min-height:100vh;margin-top:120px;z-index:3}.container1.svelte-lwtd15{padding-left:1em;padding-right:1em;border-radius:10px}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\timport { supabase, global_mod_account, global_posts } from '../../global';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\tlet in_username;\\r\\n\\tlet in_password;\\r\\n\\r\\n\\tlet signInMod = async (e) => {\\r\\n\\t\\tlet { data: moderators, error } = await supabase\\r\\n\\t\\t\\t.from('moderators')\\r\\n\\t\\t\\t.select('*')\\r\\n\\t\\t\\t.eq('username', in_username)\\r\\n\\t\\t\\t.eq('password', in_password);\\r\\n\\r\\n\\t\\t// console.log(moderators[0]);\\r\\n\\t\\t// console.log(error);\\r\\n\\t\\tif (!moderators[0]) {\\r\\n\\t\\t\\t// M.toast({ html: \`That user does not exist\` });\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\tdelete moderators[0].password;\\r\\n\\t\\t\\t\\tglobal_mod_account.set(moderators[0]);\\r\\n\\t\\t\\t\\tlocalStorage.setItem('data_mod', JSON.stringify(moderators[0]));\\r\\n\\t\\t\\t\\t// M.toast({ html: \`Welcome \${$global_mod_account.username}\` });\\r\\n\\t\\t\\t\\t// M.toast({ html: \`You will be redirected to the dashboard\` });\\r\\n\\t\\t\\t\\tsetTimeout(() => {\\r\\n\\t\\t\\t\\t\\tgoto('admin/dashboard', { replaceState: true });\\r\\n\\t\\t\\t\\t}, 500);\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\t// M.toast({ html: \`Something went wrong. Try again later\` });\\r\\n\\t\\t\\t}\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount((e) => {\\r\\n\\t\\tif (!$global_mod_account) {\\r\\n\\t\\t\\tif (localStorage.getItem('data_mod') != null) {\\r\\n\\t\\t\\t\\tglobal_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));\\r\\n\\t\\t\\t\\tgoto('admin/dashboard');\\r\\n\\t\\t\\t}\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main class=\\"white-text\\" in:fly={{ y: -20, duration: 500 }} out:fly={{ y: 20, duration: 500 }}>\\r\\n\\t<div class=\\"container\\">\\r\\n\\t\\t<h1>Moderator Account</h1>\\r\\n\\t\\t<div class=\\"container1 row blue-grey darken-4\\">\\r\\n\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t<h5>Sign in your moderator account</h5>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t<div class=\\"row white-text\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 l6 input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t<input bind:value={in_username} type=\\"text\\" id=\\"username\\" class=\\"validate white-text\\" />\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"username\\">Moderator Username</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 l6 input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\tbind:value={in_password}\\r\\n\\t\\t\\t\\t\\t\\t\\ttype=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tid=\\"password\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"validate white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t<label for=\\"password\\">Moderator Password</label>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 center-align\\">\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={signInMod}\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"btn grey black-text lighten-3 btn-large waves-effect waves-dark\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>Sign In</button\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t\\t<p>*Moderator accounts are only generated from verified community members</p>\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\r\\n\\t.container1 {\\r\\n\\t\\tpadding-left: 1em;\\r\\n\\t\\tpadding-right: 1em;\\r\\n\\t\\tborder-radius: 10px;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAqFC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AAED,WAAW,cAAC,CAAC,AACZ,YAAY,CAAE,GAAG,CACjB,aAAa,CAAE,GAAG,CAClB,aAAa,CAAE,IAAI,AACpB,CAAC"}`
};
var Admin = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_global_mod_account;
  $$unsubscribe_global_mod_account = subscribe(global_mod_account, (value) => value);
  let in_username;
  let in_password;
  $$result.css.add(css$3);
  $$unsubscribe_global_mod_account();
  return `<main class="${"white-text svelte-lwtd15"}"><div class="${"container"}"><h1>Moderator Account</h1>
		<div class="${"container1 row blue-grey darken-4 svelte-lwtd15"}"><div class="${"col s12"}"><h5>Sign in your moderator account</h5></div>
			<div class="${"col s12"}"><div class="${"row white-text"}"><div class="${"col s12 l6 input-field"}"><input type="${"text"}" id="${"username"}" class="${"validate white-text"}"${add_attribute("value", in_username, 0)}>
						<label for="${"username"}">Moderator Username</label></div>
					<div class="${"col s12 l6 input-field"}"><input type="${"password"}" id="${"password"}" class="${"validate white-text"}"${add_attribute("value", in_password, 0)}>
						<label for="${"password"}">Moderator Password</label></div>
					<div class="${"col s12 center-align"}"><button class="${"btn grey black-text lighten-3 btn-large waves-effect waves-dark"}">Sign In</button></div></div></div></div>
		<p>*Moderator accounts are only generated from verified community members</p></div>
</main>`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Admin
});
var css$2 = {
  code: "main.svelte-1j4liuo{position:relative;min-height:100vh;margin-top:120px;z-index:3}.topbutton.svelte-1j4liuo{overflow:visible}.topbutton.svelte-1j4liuo::after{content:attr(data-tooltip-content);position:absolute;top:-100%;background:#323232;box-shadow:rgba(34, 34, 34, 0.5) 0 0 10px;left:50%;width:175px;padding:0em;margin:0em;transform:translateX(-50%);opacity:0;transition:200ms ease all}.topbutton.svelte-1j4liuo:hover::after{top:-110%;opacity:1}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { global_mod_account, supabase } from '../../../global';\\r\\n\\r\\n\\timport AdminPostCard from '../../../components/AdminPostCard.svelte';\\r\\n\\r\\n\\t// component variables\\r\\n\\tlet isLoggingOut = false;\\r\\n\\tlet hasBlog = null;\\r\\n\\tlet blogs;\\r\\n\\tlet username;\\r\\n\\tlet tabActive = 1;\\r\\n\\r\\n\\t// blog content\\r\\n\\tlet blog_title;\\r\\n\\tlet blog_content;\\r\\n\\tlet blog_imageURI;\\r\\n\\tlet blog_visibility = false;\\r\\n\\r\\n\\t// methods\\r\\n\\tlet toggleVisibiltiy = (e) => {\\r\\n\\t\\tif (blog_visibility) {\\r\\n\\t\\t\\tblog_visibility = false;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tblog_visibility = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tlet toggleLogOut = (e) => {\\r\\n\\t\\tif (isLoggingOut) {\\r\\n\\t\\t\\tisLoggingOut = false;\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tisLoggingOut = true;\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\tlet logout = async (e) => {\\r\\n\\t\\tlocalStorage.setItem('data_mod', '');\\r\\n\\t\\tglobal_mod_account.set('');\\r\\n\\t\\tgoto('/admin');\\r\\n\\t};\\r\\n\\r\\n\\tlet postBlog = async (e) => {\\r\\n\\t\\tif (blog_title && blog_content) {\\r\\n\\t\\t\\tconst { data, error } = await supabase.from('posts').insert([\\r\\n\\t\\t\\t\\t{\\r\\n\\t\\t\\t\\t\\ttitle: blog_title,\\r\\n\\t\\t\\t\\t\\tauthor: $global_mod_account.username,\\r\\n\\t\\t\\t\\t\\tcontent: blog_content,\\r\\n\\t\\t\\t\\t\\theader_img: blog_imageURI ? blog_imageURI : 'https://picsum.photos/500/500',\\r\\n\\t\\t\\t\\t\\tisExclusive: blog_visibility\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t]);\\r\\n\\r\\n\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\t// M.toast({ html: 'Blog Posted' });\\r\\n\\t\\t\\t\\tblog_title = '';\\r\\n\\t\\t\\t\\tblog_content = '';\\r\\n\\t\\t\\t\\tblog_visibility = false;\\r\\n\\t\\t\\t\\tlocation.reload();\\r\\n\\t\\t\\t}\\r\\n\\t\\t} else {\\r\\n\\t\\t\\t// M.toast({ html: 'Please fill out all the input fields' });\\r\\n\\t\\t}\\r\\n\\t};\\r\\n\\r\\n\\tonMount((e) => {\\r\\n\\t\\tif (localStorage.getItem('data_mod') === null) {\\r\\n\\t\\t\\tgoto('/admin');\\r\\n\\t\\t} else {\\r\\n\\t\\t\\tglobal_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));\\r\\n\\r\\n\\t\\t\\t(async (e) => {\\r\\n\\t\\t\\t\\tif ($global_mod_account) {\\r\\n\\t\\t\\t\\t\\tconst { data, error } = await supabase\\r\\n\\t\\t\\t\\t\\t\\t.from('posts')\\r\\n\\t\\t\\t\\t\\t\\t.select('*')\\r\\n\\t\\t\\t\\t\\t\\t.eq('author', $global_mod_account.username);\\r\\n\\r\\n\\t\\t\\t\\t\\thasBlog = null;\\r\\n\\t\\t\\t\\t\\tif (error || data.length < 1) {\\r\\n\\t\\t\\t\\t\\t\\thasBlog = false;\\r\\n\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t\\tif (!error) {\\r\\n\\t\\t\\t\\t\\t\\tblogs = data;\\r\\n\\t\\t\\t\\t\\t\\thasBlog = true;\\r\\n\\t\\t\\t\\t\\t}\\r\\n\\t\\t\\t\\t}\\r\\n\\t\\t\\t})();\\r\\n\\t\\t}\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<main\\r\\n\\tstyle=\\"margin-bottom: 10em;\\"\\r\\n\\tin:fly={{ y: -20, duration: 500 }}\\r\\n\\tout:fly={{ y: 20, duration: 500 }}\\r\\n>\\r\\n\\t<div class=\\"container white-text\\">\\r\\n\\t\\t<h1>Moderator Dashboard</h1>\\r\\n\\t\\t<!-- tabs -->\\r\\n\\t\\t<div class=\\"row\\" style=\\"margin-top: 5em;\\">\\r\\n\\t\\t\\t<div class=\\"col s3 center-align\\">\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ton:click={() => (tabActive = 1)}\\r\\n\\t\\t\\t\\t\\tdata-tooltip-content=\\"Add a Story\\"\\r\\n\\t\\t\\t\\t\\tclass={tabActive == 1\\r\\n\\t\\t\\t\\t\\t\\t? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'\\r\\n\\t\\t\\t\\t\\t\\t: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<i class=\\"material-icons\\"> post_add </i>\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s3 center-align\\">\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ton:click={() => (tabActive = 2)}\\r\\n\\t\\t\\t\\t\\tdata-tooltip-content=\\"Your Stories\\"\\r\\n\\t\\t\\t\\t\\tclass={tabActive == 2\\r\\n\\t\\t\\t\\t\\t\\t? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'\\r\\n\\t\\t\\t\\t\\t\\t: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<i class=\\"material-icons\\"> menu_book </i>\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s3 center-align\\">\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ton:click={() => (tabActive = 3)}\\r\\n\\t\\t\\t\\t\\tdata-tooltip-content=\\"Your Account\\"\\r\\n\\t\\t\\t\\t\\tclass={tabActive == 3\\r\\n\\t\\t\\t\\t\\t\\t? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'\\r\\n\\t\\t\\t\\t\\t\\t: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<i class=\\"material-icons\\"> manage_accounts </i>\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"col s3 center-align\\">\\r\\n\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\ton:click={() => (tabActive = 4)}\\r\\n\\t\\t\\t\\t\\tdata-tooltip-content=\\"Edit Content\\"\\r\\n\\t\\t\\t\\t\\tclass={tabActive == 4\\r\\n\\t\\t\\t\\t\\t\\t? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'\\r\\n\\t\\t\\t\\t\\t\\t: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<i class=\\"material-icons\\"> edit </i>\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<!-- \\r\\n\\t\\t\\t -->\\r\\n\\t\\t</div>\\r\\n\\r\\n\\t\\t<!-- post a story -->\\r\\n\\t\\t{#if tabActive == 1}\\r\\n\\t\\t\\t{#if $global_mod_account}\\r\\n\\t\\t\\t\\t<div class=\\"row\\" style=\\"margin-bottom: 10em;\\" in:fly={{ x: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<h3>Post a Story</h3>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">book</i>\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_title}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_title\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"validate white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_title\\">Story Title</label>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">person</i>\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_author\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={$global_mod_account.username}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tdisabled\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"validate white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"helper-text white-text\\">Story Author</span>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">image</i>\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_imageURI}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_headerImg_src\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"validate white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_headerImg_src\\">Story Header Image URL</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"helper-text white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t>If you leave this blank, the site will generate a placeholder image</span\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"input-field\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons prefix\\">library_books</i>\\r\\n\\t\\t\\t\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tbind:value={blog_content}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tid=\\"story_content\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"validate white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t\\t\\t\\t<label for=\\"story_content\\">Story Content</label>\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"helper-text white-text\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t>This can be written as is or HTML (We recommened to write the story in HTML)</span\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<div style=\\"padding: 1em;\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{#if blog_visibility}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tThis Post will be exclusive to members\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tThis Post will be public to all visitors\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\ton:click={toggleVisibiltiy}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn waves-effect waves-light blue darken-4 \\"\\r\\n\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"valign-wrapper\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{#if blog_visibility}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons\\" style=\\"margin-right: 1em;\\"> lock </i>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>Exclusive</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons\\" style=\\"margin-right: 1em;\\"> public </i>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>Public</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12 \\" style=\\"margin-top: 2em;\\">\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={postBlog}\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"btn right btn-large waves-effect waves-light blue darken-3\\"\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t<i class=\\"material-icons left\\">post_add</i>Post</button\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t{/if}\\r\\n\\r\\n\\t\\t<!-- Your stories -->\\r\\n\\t\\t{#if tabActive == 2}\\r\\n\\t\\t\\t{#if $global_mod_account}\\r\\n\\t\\t\\t\\t<div class=\\"row\\" style=\\"margin-bottom: 10em;\\" in:fly={{ x: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<h3>Your Stories</h3>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{#if hasBlog == null}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"progress transparent\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"indeterminate blue darken-4\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Searching for your posts</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t{#if !hasBlog || blogs.length < 1}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h5>Seems like its empty</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>Make one of your own</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h5>Available Stories</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t<!-- stories -->\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each blogs as blog}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<AdminPostCard {blog} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t{/if}\\r\\n\\r\\n\\t\\t<!-- account detail -->\\r\\n\\t\\t{#if tabActive == 3}\\r\\n\\t\\t\\t{#if $global_mod_account}\\r\\n\\t\\t\\t\\t<div class=\\"row\\" in:fly={{ x: 20, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t<h3>Moderator Account Information</h3>\\r\\n\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s4\\">Account Holder</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s8\\">{$global_mod_account.username}</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s4\\">Account ID</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s8\\">{$global_mod_account.id}</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"row\\" style=\\"margin-top: 5em;\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if isLoggingOut}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s4 offset-s8 \\" in:fly|local={{ y: -25, duration: 500 }}>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ton:click={toggleLogOut}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn right btn-large waves-effect waves-light blue lighten-1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tNo</button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ton:click={logout}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tstyle=\\"margin-right: 2em;\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn right btn-large waves-effect waves-light red lighten-1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tYes</button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s6 offset-s6 \\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{#if !isLoggingOut}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tin:fly|local={{ x: 20, duration: 500 }}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ton:click={toggleLogOut}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"btn right btn-large waves-effect waves-light red lighten-1\\"\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t><i class=\\"material-icons left\\">logout</i>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tLog Out</button\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<h5 in:fly|local={{ y: -20, duration: 500 }} class=\\"right-align\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tDo you really want to log out?\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.topbutton {\\r\\n\\t\\toverflow: visible;\\r\\n\\t}\\r\\n\\t.topbutton::after {\\r\\n\\t\\tcontent: attr(data-tooltip-content);\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: -100%;\\r\\n\\t\\tbackground: #323232;\\r\\n\\t\\tbox-shadow: rgba(34, 34, 34, 0.5) 0 0 10px;\\r\\n\\t\\t/* min-width: 100px; */\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\twidth: 175px;\\r\\n\\t\\tpadding: 0em;\\r\\n\\t\\tmargin: 0em;\\r\\n\\t\\ttransform: translateX(-50%);\\r\\n\\t\\topacity: 0;\\r\\n\\t\\ttransition: 200ms ease all;\\r\\n\\t}\\r\\n\\t.topbutton:hover::after {\\r\\n\\t\\ttop: -110%;\\r\\n\\t\\topacity: 1;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAoVC,IAAI,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,UAAU,eAAC,CAAC,AACX,QAAQ,CAAE,OAAO,AAClB,CAAC,AACD,yBAAU,OAAO,AAAC,CAAC,AAClB,OAAO,CAAE,KAAK,oBAAoB,CAAC,CACnC,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,KAAK,CACV,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAE1C,IAAI,CAAE,GAAG,CACT,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,GAAG,CACX,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,yBAAU,MAAM,OAAO,AAAC,CAAC,AACxB,GAAG,CAAE,KAAK,CACV,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Dashboard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $global_mod_account, $$unsubscribe_global_mod_account;
  $$unsubscribe_global_mod_account = subscribe(global_mod_account, (value) => $global_mod_account = value);
  let blog_title;
  let blog_content;
  let blog_imageURI;
  $$result.css.add(css$2);
  $$unsubscribe_global_mod_account();
  return `<main style="${"margin-bottom: 10em;"}" class="${"svelte-1j4liuo"}"><div class="${"container white-text"}"><h1>Moderator Dashboard</h1>
		
		<div class="${"row"}" style="${"margin-top: 5em;"}"><div class="${"col s3 center-align"}"><button data-tooltip-content="${"Add a Story"}" class="${escape2(null_to_empty("btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton")) + " svelte-1j4liuo"}"><i class="${"material-icons"}">post_add </i></button></div>
			<div class="${"col s3 center-align"}"><button data-tooltip-content="${"Your Stories"}" class="${escape2(null_to_empty("btn-floating btn-large waves-effect waves-light pink darken-2 topbutton")) + " svelte-1j4liuo"}"><i class="${"material-icons"}">menu_book </i></button></div>
			<div class="${"col s3 center-align"}"><button data-tooltip-content="${"Your Account"}" class="${escape2(null_to_empty("btn-floating btn-large waves-effect waves-light pink darken-2 topbutton")) + " svelte-1j4liuo"}"><i class="${"material-icons"}">manage_accounts </i></button></div>
			<div class="${"col s3 center-align"}"><button data-tooltip-content="${"Edit Content"}" class="${escape2(null_to_empty("btn-floating btn-large waves-effect waves-light pink darken-2 topbutton")) + " svelte-1j4liuo"}"><i class="${"material-icons"}">edit </i></button></div>
			</div>

		
		${`${$global_mod_account ? `<div class="${"row"}" style="${"margin-bottom: 10em;"}"><div class="${"col s12"}"><h3>Post a Story</h3></div>
					<div class="${"col s12"}"><div class="${"input-field"}"><i class="${"material-icons prefix"}">book</i>
							<input id="${"story_title"}" type="${"text"}" class="${"validate white-text"}"${add_attribute("value", blog_title, 0)}>
							<label for="${"story_title"}">Story Title</label></div></div>
					<div class="${"col s12"}"><div class="${"input-field"}"><i class="${"material-icons prefix"}">person</i>
							<input id="${"story_author"}" type="${"text"}" disabled class="${"validate white-text"}"${add_attribute("value", $global_mod_account.username, 0)}>
							<span class="${"helper-text white-text"}">Story Author</span></div></div>
					<div class="${"col s12"}"><div class="${"input-field"}"><i class="${"material-icons prefix"}">image</i>
							<input id="${"story_headerImg_src"}" type="${"text"}" class="${"validate white-text"}"${add_attribute("value", blog_imageURI, 0)}>
							<label for="${"story_headerImg_src"}">Story Header Image URL</label>
							<span class="${"helper-text white-text"}">If you leave this blank, the site will generate a placeholder image</span></div></div>
					<div class="${"col s12"}"><div class="${"input-field"}"><i class="${"material-icons prefix"}">library_books</i>
							<input id="${"story_content"}" type="${"text"}" class="${"validate white-text"}"${add_attribute("value", blog_content, 0)}>
							<label for="${"story_content"}">Story Content</label>
							<span class="${"helper-text white-text"}">This can be written as is or HTML (We recommened to write the story in HTML)</span></div></div>
					<div class="${"col s12"}"><div style="${"padding: 1em;"}"><p>${`This Post will be public to all visitors`}</p>
							<button class="${"btn waves-effect waves-light blue darken-4 "}"><div class="${"valign-wrapper"}">${`<i class="${"material-icons"}" style="${"margin-right: 1em;"}">public </i>
										<span>Public</span>`}</div></button></div></div>
					<div class="${"col s12 "}" style="${"margin-top: 2em;"}"><button class="${"btn right btn-large waves-effect waves-light blue darken-3"}"><i class="${"material-icons left"}">post_add</i>Post</button></div></div>` : ``}`}

		
		${``}

		
		${``}</div>
</main>`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Dashboard
});
var css$1 = {
  code: "main.svelte-vykyeh{position:relative;min-height:100vh;margin-top:120px;z-index:3}.scroller.svelte-vykyeh{position:fixed;bottom:-7%;left:-10%;color:white;opacity:0.2;font-size:10rem;font-family:'Thunder Bold';user-select:none;z-index:1}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\r\\n\\timport { fly, fade, scale, blur } from 'svelte/transition';\\r\\n\\timport MarqueeTextWidget from 'svelte-marquee-text-widget';\\r\\n\\r\\n\\timport { supabase, global_account, global_posts } from '../../global';\\r\\n\\timport Post_BlogCard from '../../components/Post_BlogCard.svelte';\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\r\\n\\tlet hasAccount = false;\\r\\n\\tlet privateBlogs;\\r\\n\\tlet publicBlogs;\\r\\n\\tlet hasPrivateBlogs = null;\\r\\n\\tlet hasPublicBlogs = null;\\r\\n\\tlet blogs;\\r\\n\\tlet hasBlogs = null;\\r\\n\\r\\n\\tonMount((e) => {\\r\\n\\t\\tif (window.localStorage.getItem('data')) {\\r\\n\\t\\t\\thasAccount = true;\\r\\n\\t\\t}\\r\\n\\t\\t(async (e) => {\\r\\n\\t\\t\\tlet { data, error } = await supabase.from('posts').select('*');\\r\\n\\t\\t\\thasBlogs = null;\\r\\n\\t\\t\\tif (!error || data) {\\r\\n\\t\\t\\t\\thasBlogs = true;\\r\\n\\t\\t\\t\\tblogs = data;\\r\\n\\t\\t\\t}\\r\\n\\t\\t})();\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n\\t<title>Abie G | Posts</title>\\r\\n</svelte:head>\\r\\n\\r\\n<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>\\r\\n\\t<div class=\\"container white-text\\">\\r\\n\\t\\t<h2>See what's new</h2>\\r\\n\\t\\t<div class=\\"container1\\">\\r\\n\\t\\t\\t<div class=\\"row\\">\\r\\n\\t\\t\\t\\t<!-- <div class=\\"col s12 disabled\\" style=\\"margin-bottom: 10em;\\">\\r\\n\\t\\t\\t\\t\\t<h4>Exclusive Posts</h4>\\r\\n\\t\\t\\t\\t\\t{#if hasAccount}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"container1\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if hasPrivateBlogs == null}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"progress transparent\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"indeterminate blue darken-4\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<p>Searching for public posts</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t{:else if hasPrivateBlogs}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{#each privateBlogs as blog, index}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<Post_BlogCard {...blog} {index} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<h5>Seems like its empty</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t<p>Log in to enjoy exclusive content</p>\\r\\n\\t\\t\\t\\t\\t\\t<a href=\\"/account\\" class=\\"btn waves-effect waves-light blue darken-4\\">Go to Accounts</a>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t</div> -->\\r\\n\\t\\t\\t\\t<div class=\\"col s12\\" style=\\"margin-bottom: 10em;\\">\\r\\n\\t\\t\\t\\t\\t<h4>Posts</h4>\\r\\n\\t\\t\\t\\t\\t<div class=\\"container1\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if hasBlogs == null}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"col s12\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"progress transparent\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"indeterminate blue darken-4\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<h5>Searching for posts</h5>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{:else if hasBlogs}\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each blogs as blog, index}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<Post_BlogCard {...blog} {index} />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t<h5>Seems like its empty</h5>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n</main>\\r\\n<div class=\\"scroller\\" transition:fade={{ duration: 500 }}>\\r\\n\\t<MarqueeTextWidget duration={15}\\r\\n\\t\\t>SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp;</MarqueeTextWidget\\r\\n\\t>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tmargin-top: 120px;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.scroller {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\tbottom: -7%;\\r\\n\\t\\tleft: -10%;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\topacity: 0.2;\\r\\n\\t\\tfont-size: 10rem;\\r\\n\\t\\tfont-family: 'Thunder Bold';\\r\\n\\t\\tuser-select: none;\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA8FC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,SAAS,cAAC,CAAC,AACV,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,GAAG,CACX,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,cAAc,CAC3B,WAAW,CAAE,IAAI,CACjB,OAAO,CAAE,CAAC,AACX,CAAC"}`
};
var Posts = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `${$$result.head += `${$$result.title = `<title>Abie G | Posts</title>`, ""}`, ""}

<main class="${"svelte-vykyeh"}"><div class="${"container white-text"}"><h2>See what&#39;s new</h2>
		<div class="${"container1"}"><div class="${"row"}">
				<div class="${"col s12"}" style="${"margin-bottom: 10em;"}"><h4>Posts</h4>
					<div class="${"container1"}">${`<div class="${"col s12"}"><div class="${"progress transparent"}"><div class="${"indeterminate blue darken-4"}"></div></div>
								<h5>Searching for posts</h5></div>`}</div></div></div></div></div></main>
<div class="${"scroller svelte-vykyeh"}">${validate_component(MarqueeTextWidget, "MarqueeTextWidget").$$render($$result, { duration: 15 }, {}, {
    default: () => `SEE WHAT&#39;S GOING ON \xA0 SEE WHAT&#39;S GOING ON \xA0 SEE WHAT&#39;S GOING ON \xA0`
  })}
</div>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Posts
});
var supportsPassive = false;
try {
  let opts = Object.defineProperty({}, "passive", {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
} catch (e) {
}
(function() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof HTMLElement === "undefined") {
    return;
  }
  var supportsPreventScrollOption = false;
  try {
    var focusElem = document.createElement("div");
    focusElem.addEventListener("focus", function(event) {
      event.preventDefault();
      event.stopPropagation();
    }, true);
    focusElem.focus(Object.defineProperty({}, "preventScroll", {
      get: function() {
        if (navigator && typeof navigator.userAgent !== "undefined" && navigator.userAgent && navigator.userAgent.match(/Edge\/1[7-8]/)) {
          return supportsPreventScrollOption = false;
        }
        supportsPreventScrollOption = true;
      }
    }));
  } catch (e) {
  }
  if (HTMLElement.prototype.nativeFocus === void 0 && !supportsPreventScrollOption) {
    HTMLElement.prototype.nativeFocus = HTMLElement.prototype.focus;
    var calcScrollableElements = function(element) {
      var parent = element.parentNode;
      var scrollableElements = [];
      var rootScrollingElement = document.scrollingElement || document.documentElement;
      while (parent && parent !== rootScrollingElement) {
        if (parent.offsetHeight < parent.scrollHeight || parent.offsetWidth < parent.scrollWidth) {
          scrollableElements.push([
            parent,
            parent.scrollTop,
            parent.scrollLeft
          ]);
        }
        parent = parent.parentNode;
      }
      parent = rootScrollingElement;
      scrollableElements.push([parent, parent.scrollTop, parent.scrollLeft]);
      return scrollableElements;
    };
    var restoreScrollPosition = function(scrollableElements) {
      for (var i = 0; i < scrollableElements.length; i++) {
        scrollableElements[i][0].scrollTop = scrollableElements[i][1];
        scrollableElements[i][0].scrollLeft = scrollableElements[i][2];
      }
      scrollableElements = [];
    };
    var patchedFocus = function(args) {
      if (args && args.preventScroll) {
        var evScrollableElements = calcScrollableElements(this);
        if (typeof setTimeout === "function") {
          var thisElem = this;
          setTimeout(function() {
            thisElem.nativeFocus();
            restoreScrollPosition(evScrollableElements);
          }, 0);
        } else {
          this.nativeFocus();
          restoreScrollPosition(evScrollableElements);
        }
      } else {
        this.nativeFocus();
      }
    };
    HTMLElement.prototype.focus = patchedFocus;
  }
})();
var css = {
  code: "main.svelte-a5hwkn{position:relative;min-height:100vh;z-index:3}.imgContainer.svelte-a5hwkn{position:fixed;top:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;z-index:1;perspective:1px;opacity:1;transition:500ms ease all}.flex.svelte-a5hwkn{position:relative;height:50vh;display:flex;justify-content:center;align-items:center;text-align:center;z-index:2;margin-top:50vh}.backbutton.svelte-a5hwkn{margin-bottom:5em}.content.svelte-a5hwkn{position:relative;z-index:2;margin-bottom:5em}img.svelte-a5hwkn{position:absolute;width:100%;height:100%;object-fit:cover;object-position:center}",
  map: `{"version":3,"file":"[slug].svelte","sources":["[slug].svelte"],"sourcesContent":["<script context=\\"module\\">\\r\\n\\texport const load = async (e) => {\\r\\n\\t\\tlet slug = e.page.params.slug;\\r\\n\\t\\treturn { props: { slug } };\\r\\n\\t};\\r\\n<\/script>\\r\\n\\r\\n<script>\\r\\n\\timport { goto } from '$app/navigation';\\r\\n\\r\\n\\timport { onMount } from 'svelte';\\r\\n\\timport { fade, fly } from 'svelte/transition';\\r\\n\\timport { global_posts, supabase } from '../../global';\\r\\n\\timport { Parallax, ParallaxLayer } from 'svelte-parallax';\\r\\n\\r\\n\\texport let slug;\\r\\n\\texport let blogData;\\r\\n\\r\\n\\tlet image;\\r\\n\\r\\n\\tonMount(async (e) => {\\r\\n\\t\\tlet { data, error } = await supabase.from('posts').select('*').eq('id', slug);\\r\\n\\r\\n\\t\\tif (!error || data.length > 0) {\\r\\n\\t\\t\\tblogData = data[0];\\r\\n\\r\\n\\t\\t\\t// console.log(blogData);\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\twindow.onscroll = (e) => {\\r\\n\\t\\t\\tif (window.scrollY > 100) {\\r\\n\\t\\t\\t\\timage.style.opacity = 0;\\r\\n\\t\\t\\t\\timage.style.transform = 'translateY(-10%)';\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\timage.style.opacity = 1;\\r\\n\\t\\t\\t\\timage.style.transform = 'translateY(0)';\\r\\n\\t\\t\\t}\\r\\n\\t\\t};\\r\\n\\t\\twindow.onload = (e) => {\\r\\n\\t\\t\\tif (window.scrollY > 100) {\\r\\n\\t\\t\\t\\timage.style.opacity = 0;\\r\\n\\t\\t\\t\\timage.style.transform = 'translateY(-10%)';\\r\\n\\t\\t\\t} else {\\r\\n\\t\\t\\t\\timage.style.opacity = 1;\\r\\n\\t\\t\\t\\timage.style.transform = 'translateY(0)';\\r\\n\\t\\t\\t}\\r\\n\\t\\t};\\r\\n\\t});\\r\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n\\t{#if blogData}\\r\\n\\t\\t<title>ABIE G | {blogData.title}</title>\\r\\n\\t{/if}\\r\\n</svelte:head>\\r\\n\\r\\n<main id=\\"top\\" in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>\\r\\n\\t<div class=\\"imgContainer\\" bind:this={image}>\\r\\n\\t\\t{#if blogData}\\r\\n\\t\\t\\t<img src={blogData.header_img} alt=\\"\\" />\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n\\t<div class=\\"flex \\">\\r\\n\\t\\t<div class=\\"container blue darken-4 white-text\\" style=\\"padding: 1em; border-radius: 10px;\\">\\r\\n\\t\\t\\t{#if blogData}\\r\\n\\t\\t\\t\\t<h3>{blogData.title}</h3>\\r\\n\\t\\t\\t\\t<p>by: {blogData.author}</p>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container backbutton\\">\\r\\n\\t\\t<a class=\\"btn-floating btn-large waves-effect waves-light  blue lighten-2\\" href=\\"/posts\\"\\r\\n\\t\\t\\t><i class=\\"material-icons\\">arrow_back</i></a\\r\\n\\t\\t>\\r\\n\\t</div>\\r\\n\\t<div class=\\"container content\\">\\r\\n\\t\\t{#if blogData}\\r\\n\\t\\t\\t<p class=\\"flow-text white-text\\">{@html blogData.content}</p>\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n</main>\\r\\n\\r\\n<style>\\r\\n\\tmain {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\t.imgContainer {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\twidth: 100vw;\\r\\n\\t\\theight: 100vh;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tz-index: 1;\\r\\n\\t\\tperspective: 1px;\\r\\n\\t\\topacity: 1;\\r\\n\\t\\ttransition: 500ms ease all;\\r\\n\\t}\\r\\n\\t.flex {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\theight: 50vh;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\tmargin-top: 50vh;\\r\\n\\t}\\r\\n\\t.backbutton {\\r\\n\\t\\tmargin-bottom: 5em;\\r\\n\\t}\\r\\n\\t.content {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\tmargin-bottom: 5em;\\r\\n\\t}\\r\\n\\timg {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tobject-fit: cover;\\r\\n\\t\\tobject-position: center;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAmFC,IAAI,cAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,KAAK,CACjB,OAAO,CAAE,CAAC,AACX,CAAC,AACD,aAAa,cAAC,CAAC,AACd,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,CAAC,CACN,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,CAAC,CACV,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,GAAG,AAC3B,CAAC,AACD,KAAK,cAAC,CAAC,AACN,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,IAAI,AACjB,CAAC,AACD,WAAW,cAAC,CAAC,AACZ,aAAa,CAAE,GAAG,AACnB,CAAC,AACD,QAAQ,cAAC,CAAC,AACT,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,aAAa,CAAE,GAAG,AACnB,CAAC,AACD,GAAG,cAAC,CAAC,AACJ,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,CACjB,eAAe,CAAE,MAAM,AACxB,CAAC"}`
};
var load = async (e) => {
  let slug = e.page.params.slug;
  return { props: { slug } };
};
var U5Bslugu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { slug } = $$props;
  let { blogData } = $$props;
  let image;
  if ($$props.slug === void 0 && $$bindings.slug && slug !== void 0)
    $$bindings.slug(slug);
  if ($$props.blogData === void 0 && $$bindings.blogData && blogData !== void 0)
    $$bindings.blogData(blogData);
  $$result.css.add(css);
  return `${$$result.head += `${blogData ? `${$$result.title = `<title>ABIE G | ${escape2(blogData.title)}</title>`, ""}` : ``}`, ""}

<main id="${"top"}" class="${"svelte-a5hwkn"}"><div class="${"imgContainer svelte-a5hwkn"}"${add_attribute("this", image, 0)}>${blogData ? `<img${add_attribute("src", blogData.header_img, 0)} alt="${""}" class="${"svelte-a5hwkn"}">` : ``}</div>
	<div class="${"flex  svelte-a5hwkn"}"><div class="${"container blue darken-4 white-text"}" style="${"padding: 1em; border-radius: 10px;"}">${blogData ? `<h3>${escape2(blogData.title)}</h3>
				<p>by: ${escape2(blogData.author)}</p>` : ``}</div></div>
	<div class="${"container backbutton svelte-a5hwkn"}"><a class="${"btn-floating btn-large waves-effect waves-light blue lighten-2"}" href="${"/posts"}"><i class="${"material-icons"}">arrow_back</i></a></div>
	<div class="${"container content svelte-a5hwkn"}">${blogData ? `<p class="${"flow-text white-text"}"><!-- HTML_TAG_START -->${blogData.content}<!-- HTML_TAG_END --></p>` : ``}</div>
</main>`;
});
var _slug_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bslugu5D,
  load
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
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/** @preserve
	(c) 2012 by Cédric Mesnil. All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
/** @preserve
 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
 * derived from CryptoJS.mode.CTR
 * Jan Hruby jhruby.web@gmail.com
 */
