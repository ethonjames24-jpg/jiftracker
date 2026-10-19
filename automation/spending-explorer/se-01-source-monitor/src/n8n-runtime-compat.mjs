// Serializable helpers for the n8n 2.25.7 Code-node sandbox.
// No imports, host globals, Web Crypto, or URL dependency inside either function.
export function sha256Bytes(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const k = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  const h = [1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];
  const w = new Uint32Array(64);
  function chunk(block, offset) {
    for(let j=0;j<16;j++){const i=offset+j*4;w[j]=((block[i]<<24)|(block[i+1]<<16)|(block[i+2]<<8)|block[i+3])>>>0;}
    for(let j=16;j<64;j++){const a=w[j-15],b=w[j-2],s0=((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3),s1=((b>>>17)|(b<<15))^((b>>>19)|(b<<13))^(b>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,z]=h;
    for(let j=0;j<64;j++){const s1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)),ch=(e&f)^(~e&g),t1=(z+s1+ch+k[j]+w[j])>>>0,s0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)),maj=(a&b)^(a&c)^(b&c),t2=(s0+maj)>>>0;z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    const v=[a,b,c,d,e,f,g,z];for(let j=0;j<8;j++)h[j]=(h[j]+v[j])>>>0;
  }
  const full=bytes.length-bytes.length%64;
  for(let i=0;i<full;i+=64)chunk(bytes,i);
  const tail=Buffer.alloc(bytes.length-full<56?64:128);
  bytes.copy(tail,0,full);tail[bytes.length-full]=128;
  const bits=bytes.length*8;
  tail.writeUInt32BE(Math.floor(bits/0x100000000),tail.length-8);
  tail.writeUInt32BE(bits>>>0,tail.length-4);
  for(let i=0;i<tail.length;i+=64)chunk(tail,i);
  return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}

// A deliberately scoped MOFPS link resolver, not a general WHATWG URL polyfill.
export function canonicalMofUrl(raw, base) {
  const value=String(raw).trim();
  if(!value||/[\x00-\x1f\x7f\\]/.test(value))throw new Error('SOURCE_URL_INVALID');
  const baseMatch=String(base).match(/^https:\/\/(www\.mof\.gov\.jm|mof\.gov\.jm)(\/[^?#]*)?(?:[?#].*)?$/i);
  if(!baseMatch)throw new Error('SOURCE_BASE_URL_INVALID');
  let authority=baseMatch[1],path=value;
  const absolute=value.match(/^https:\/\/([^/?#]+)([^?#]*)/i);
  const relativeAuthority=value.match(/^\/\/([^/?#]+)([^?#]*)/);
  if(absolute||relativeAuthority){const m=absolute||relativeAuthority;authority=m[1];path=m[2]||'/';}
  else {
    if(/^[a-z][a-z0-9+.-]*:/i.test(value))throw new Error('SOURCE_URL_PROTOCOL_INVALID');
    path=value.split(/[?#]/,1)[0];
    if(!path)path=baseMatch[2]||'/';
    else if(!path.startsWith('/'))path=(baseMatch[2]||'/').replace(/[^/]*$/,'')+path;
  }
  if(!/^(?:www\.)?mof\.gov\.jm(?::443)?$/i.test(authority))throw new Error('SOURCE_URL_HOST_INVALID');
  const segments=[];
  for(const segment of path.split('/')){
    const dot=segment.replace(/%2e/ig,'.');
    if(dot==='..'){if(segments.length>1)segments.pop();}
    else if(dot!=='.')segments.push(segment);
  }
  if(/\/(?:\.{1,2}|%2e|\.%2e|%2e\.|%2e%2e)$/i.test(path))segments.push('');
  const pathname=encodeURI(segments.join('/')||'/').replace(/%25/g,'%');
  return {url:'https://www.mof.gov.jm'+pathname,hostname:'www.mof.gov.jm',pathname};
}
