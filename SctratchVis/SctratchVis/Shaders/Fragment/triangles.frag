#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

out vec4 retColor;

#define sinc(x) (sin(x) / x)
#define cosc(x) (cos(x) / x)

float hash(vec2 p)
{
	float ret = fract(43316.3317 * sin(dot(p, vec2(12.5316, 17.15611))));
	return ret;
}

float N(vec2 p)
{
	vec2 i = floor(p);
	vec2 fr = fract(p);

	float a0 = hash(i);
	float a1 = hash(i + vec2(1.0, 0.0));
	float a2 = hash(i + vec2(0.0, 1.0));
	float a3 = hash(i + vec2(1.0, 1.0));

	vec2 u = fr * fr * (3.0 - 2.0 * fr);
	float ret = mix(mix(a0, a1, u.x), mix(a2, a3, u.x), u.y);

	return ret;
}

vec2 N2(vec2 p)
{
	vec2 ret = vec2(N(p), N(p + vec2(1.0)));
	return ret;
}

float sdLine(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

	float ret = length(pa - h * ba);
	return ret;
}

vec3 rot3(vec3 p, float an, vec3 ax)
{
	vec3 a = normalize(ax);
	float s = sin(an);
	float c = cos(an);
	float r = 1.0 - c;
	mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );

	vec3 ret = m * p;

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

vec3 col(vec2 p)
{
	vec2 q = p;
	vec3 ret;
	vec3 c = vec3(0.0);

	vec3 vf = uSpec3;
	float lvf;
	float f, ff, lkf, lkff, lif, liff, fd, ffd;
	f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	//float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	ff = fract(f * 100.0);
	lkf = lanczosKernel(2, f);
	lkff = lanczosKernel(2, ff);
	lif = lanczosInterp(3, sin(f) * 100.0 * TAU);
	liff = lanczosInterp(3, sin(ff) * 100.0 * TAU);

	vf *= sin((liff * 0.25) * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((uTime * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);
	float fs = atan(df, lvf);
	float t = uTime - step(f, fs);

	q.y /= sqrt(3.0) / 2.0;
	q.x += q.y * 0.5;

	vec2 i = floor(q);

	t = uTime + (uFreq > 0.0001 ? 
					sin(uFreq)
					: 0.0);
	
	// corners moving
	vec2 a0 = N2(i + t) + i;
	vec2 a1 = N2(i + vec2(	1.0,	0.0)	+ t) + i + vec2(	1.0,	0.0);
	vec2 a2 = N2(i + vec2(	-1.0,	0.0)	+ t) + i + vec2(	-1.0,	0.0);
	vec2 a3 = N2(i + vec2(	0.0,	1.0)	+ t) + i + vec2(	0.0,	1.0);
	vec2 a4 = N2(i + vec2(	0.0,	-1.0)	+ t) + i + vec2(	0.0,	-1.0);
	vec2 a5 = N2(i + vec2(	1.0,	1.0)	+ t) + i + vec2(	1.0,	1.0);
	vec2 a6 = N2(i + vec2(	-1.0,	-1.0)	+ t) + i + vec2(	-1.0,	-1.0);

	// inner triangles
	float l = 0.15;//sin(f);
	l /= abs(uFreq - atan(sin(lvf), liff));

	l = min(l, sdLine(q, a0, a1));
	l = min(l, sdLine(q, a0, a2));
	l = min(l, sdLine(q, a0, a3));
	l = min(l, sdLine(q, a0, a4));
	l = min(l, sdLine(q, a0, a5));
	l = min(l, sdLine(q, a0, a6));
	l = min(l, sdLine(q, a3, a2));
	l = min(l, sdLine(q, a4, a1));

	float s = sin(l * 150.0 * PI);

	float na = uFreq > 0.0001 ?
			sin(lif) 
			: 1.0;

	vec3 rot = rot3(
			normalize(vec3(q, na)), 
			radians(hash(vec2(t))), 
			vec3(lif, 0.0, 1.0)
		);

	float r, g, b;
	r = length(reflect(rot, normalize(rot)));
	g = uFreq > 0.0001 ? 
		cos(uTime) + f * pow(f, sinc(uTime / t) / fs) * t + f
		: 0.4;
	b = uFreq > 0.0001 ? 
		abs(1.0 - lvf) + 0.5
		: 0.8;

	c = vec3(r, g, b);
	c *= s;

	ret = c;
	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy * 2.0 - uRes.xy) / min(uRes.x, uRes.y);
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}