#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float hash(vec2 p)
{
	vec3 q = vec3(p.xy, 1.0);
	float ret = fract(sin(dot(q, vec3(37.1, 61.7, 12.4))) * 375.85453123);
	return ret;
}

float noise(vec2 p)
{
	vec2 i = floor(p);
	vec2 f = fract(p);
	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
					mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
					f.y);

	return ret;
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p);
		p *= m;
	}

	return v;
}

float fbm(vec2 p)
{
	float v = 0.0;
	float n = 2.8;
	float c = 4.0;

	for (float i = 1.0; i <= c; i++)
		v += perlin(p * i, uFreq) * (n - i + uFreq) / (n * n * n * sin(uFreq));

	float ret = v;

	return ret;
}

float lanczosKernel(int ai, float x)
{
	float ret;
	float af = float(ai);

	if (x == 0.0)
		return 1.0;
	if (-af <= x && x < af)
		return (af * sin(PI * x) * sin((PI * x) / af)) / ((PI * PI) * (x * x));
	else
		return 0;
}

float lanczosInterp(int ai, float x)
{
	float ret = 0.0;
	int ub = int(floor(x));
	int lb = int(floor(x)) - ai + 1;

	for (int i = lb; i <= ub; i++)
	{
		ret += uSpectrum[i] * lanczosKernel(ai, x - float(i));
		//ret = mod(abs(ret), 1.0);
	}

	return abs(ret);
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(PI * a), cos(PI * a)
	);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec2 q = p;
	//q.x *= uRes.x / uRes.y;
	q.x = dot(q, q * 2.0);

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float lif = lanczosInterp(3, f);
	float liff = lanczosInterp(3, ff);

	float fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	float ffd = max(ff, liff) / min(ff, liff);
	fd = mod(fd, 1.0);

	float fn = fbm(vec2(liff / fd, lif / ffd));

	q *= rot(fd * uTime);

	vec3 fc = vec3(0.0);
	float i = 1.0;
	float hh = 0.1;

	// blue line
	float t = abs(1.0 / ((q.y - fbm(q + (uTime * 3.0) / i)) * 75.0));
	fc += t * vec3(hh + 0.1, 0.5, 2.0);

	// red circle
	float u = abs(1.0 / ((q.x - fbm(q + (uTime * ff) / f)) * 75.0));
	fc += u * vec3(2.0, 0.5, hh + 0.1);

	// green circle
	float v = abs(1.0 / ((q.x - q.y - fbm(q + (uTime * 5.0) / i)) * 75.0));
	fc += v * vec3(hh + 0.1, 2.0, 0.5);

	// yellow circle
	float w = abs(1.0 / ((q.x - q.y - fbm(q + (uTime * fn) / i)) * 75.0));
	fc += w * vec3(0.7, 0.7, hh + 0.1);
	
	// purple circle
	float x = abs(1.0 / ((q.x * sin(lif) - q.y * cos(uTime) - fbm(q + (uTime * fn) / i)) * 75.0));
	fc += x * vec3(0.5, hh, 0.5);

	ret = fc;

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;


	//ret = vec4(col(uv), 1.0);
	ret += vec4(col(vec2(uv.x, uv.y - 1.0)), 1.0);
	ret += vec4(col(vec2(uv.x, uv.y + 1.0)), 1.0);
	retColor = ret;
}
