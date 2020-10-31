#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
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

vec2 rotate(vec2 space, vec2 center, float amount)
{
	return vec2(
		cos(amount) * (space.x - center.x) + sin(amount) * (space.y - center.y),
		cos(amount) * (space.y - center.y) - sin(amount) * (space.x - center.x)
			);
}

float reflection(inout vec2 p, float theta)
{
	vec2 norm = vec2(cos(theta), sin(theta));

	float d = dot(p, norm);
	p -= norm * min(0.0, d) * 2.0;

	return smoothstep(0.1, 0.0, abs(d));
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d)
{
	vec3 ret = a + b * cos(TAU * (c * t + d));

	return ret;
}

float apollonian(vec2 z, float f)
{
	float s = 1.0;
	
	for (int i = 0; i < 10; i++)
	{
		float a = 4.0 / dot(z, z);
		z *= a;
		s *= a;

		reflection(z, -PI / 2.0);
		z.y = 2.0 * fract(z.y * 0.5) - 1.0;
	}

	//z /= perlin(z, f);
	z *= 2.0;
	z.x /= perlin(z, f);
	z.y *= perlin(z, f);

	return (length(z) - 0.3) / s;
}

vec4 col2(vec2 p)
{
	vec4 ret;
	float m = min(0.5, fract(uFreq * 100.0));
	p *= (sin(uTime - m) / cos(uTime * m));
	p *= rot(uTime * 0.1);
	vec2 q = p;
	float f, ff, lkf, lkff, lif, liff, fd, ffd;

	f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	ff = fract(f * 100.0);
	lkf = lanczosKernel(2, f);
	lkff = lanczosKernel(2, ff);
	lif = lanczosInterp(3, sin(f) * 100.0 * TAU);
	liff = lanczosInterp(3, sin(ff) * 100.0 * TAU);

	fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	ffd = max(ff, liff) / min(ff, liff);
	ffd = mod(ffd, 1.0);

	q /= 10.0;
	q *= rot(uTime * 0.1);
	vec4 color = vec4(0.5);

	vec3 a = vec3(0.2);
	vec3 b = vec3(0.5);
	vec3 c = vec3(3.0, 1.5, 2.0);
	vec3 d = vec3(0.1, 0.17, 0.23);

	float cir = perlin(q, 1.5) - length(q);
	float t = min(f * 10.0, 
		apollonian(q, (fract(uFreq) * 10.0) + sin(ff - uDeltaFreq))
	);
	color.rgb = palette(t + (uTime) * 0.21, a, b, c, d);
	color.w = mod(uFreq + 0.75, 0.5);

	ret = color;

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	//vec2 uv = (gl_FragCoord.xy / uRes.xy * 2.0 - 1.0);
	//vec2 uv = vec2(uRes.y / uRes.x, 1.0);

	vec4 ret;

	//ret = vec4(col(uv), 1.0);
	ret = col2(uv);

	retColor = ret;
}