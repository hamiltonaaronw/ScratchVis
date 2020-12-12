#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float[256] uSpectrum;
uniform vec2 uRes;
uniform float uTime;

out vec4 retColor;

float sinc(float x) { return sin(x) / x;	}
float cosc(float x) { return cos(x) / x;	}

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
		-sin(a), cos(a)
	);
}

float hash(vec2 p, float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sin(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4))) * 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);

	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x),
					mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x),
					f.y) * s;

	return ret;
}

float perlin(vec2 p, float f)
{
	mat2 m = mat2(2.0);
	float v = 0.0;
	float s = 1.0;

	for (int i = 0; i < 7; i++, s /= 2.0)
	{
		v += s * noise(p, f);
		p *= m;
	}

	return v;
} 

vec3 hsv2rgb(vec3 c)
{
	vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);

	return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}

vec3 trans(vec3 p)
{
	return mod(p, 4.0 * 2.0) - 2.0;
}

float sphere(vec3 p, float sz)
{
	return length(trans(p)) - sz;
}

vec3 getNormal(vec3 p, float sz)
{
	float ep = 0.0001;
	return normalize(vec3(
		sphere(p, sz) - sphere(vec3(p.x - ep, p.y, p.z), sz),
		sphere(p, sz) - sphere(vec3(p.x, p.y - ep, p.z), sz),
		sphere(p, sz) - sphere(vec3(p.x, p.y, p.z - sz), sz)
	));
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

float rand(vec2 st)
{
	return fract(sin(dot(st, vec2(12.9898, 78.233))) * 42758.5453);
}

float perlinNoise(float x)
{
	float al = rand(vec2(floor(x), 0.1));
	float ar = rand(vec2(floor(x + 1.0), 0.1));
	float wl = al * fract(x);
	float wr = ar * (fract(x) - 1.0);
	float f = fract(x);
	float u = pow(f, 2.0) * (3.0 - 2.0 * f);
	float n = mix(wl, wr, u);
	return n;
}

vec3 col(vec2 p)
{
	vec2 q;
	vec3 ret;

	q = p;
	q *= rot(uTime - fract(sinc(uFreq) * 100.0) * 0.025);
	//q = vec2(uRes.x / uRes.y, 1.0);

	float f = abs(uFreq + uLastFreq / mod(uTime, 1.0)) * mod(sin(uTime), 0.5);
	float ff = fract(fract(f * 1000.0) + fract(f * 100.0)) + (fract(f  * 10.0)); 

	vec3 cPos = vec3(0.0, 0.0, (10.0 * fract(uFreq * 100.0)) / sin(uTime / fract(sinc(uFreq) * 100.0)));
	vec3 lPos = normalize(vec3(1.0));

	vec3 c = vec3(0.0);

	vec3 ray = normalize(vec3(q, 0.0) - cPos);
	vec3 cur = cPos;

	for (int i = 0; i < 64; i++)
	{
		float d = sphere(cur, 0.5);
		d = sphere(cur, 0.5 + perlinNoise(sinc(d * ff) + (ff * sin(uTime))));

		if (d < 0.001 + fract(cosc(ff * mod(uTime, uFreq)) * 100.0))
		{
			vec3 norm = getNormal(cur, 0.5);
			float dif = dot(norm, lPos);

			c = vec3(1.0) * dif * hsv2rgb(ff / length(cur * 0.1) + perlinNoise(uTime), 1.0, 1.0) * 3.0;
			break;
		}

		cur += ray * d;
	}

	//ret = vec3(1.0, 0.0, 0.0);
	//ret = vec3(0.0, 1.0, 0.0);
	ret = vec3(0.0, 0.0, 1.0);

	//ret *= q.x;

	ret = c;

	return ret;
}

void main()
{
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret;

	vec3 c = col(uv);
	//float a = smoothstep(0.0, 0.1, min(min(c.r, c.g), c.b));

	ret = vec4(c, 1.0);

	retColor = ret;
}