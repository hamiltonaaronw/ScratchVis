#version 410

// derived from https://glslsandbox.com/e#101827.0

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

#define R(p, a, t) mix(a * dot(p, a), p, cos(t)) + sin(t) * cross(p, a)
#define H(h) (cos((h) * 6.3 + vec3(0.0, 23.0, 21.0)) * 0.5 + 0.5)
#define sinc(x) sin(x) / x
#define cosc(x) cos(x) / x

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
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
	vec3 ret;
	vec3 c = vec3(0.0);

	float m = min(0.5, fract(uFreq * 100.0));
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

	float t = uTime;// + lif;

	/*
	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = uSpec3;
	float lvf;
	float t = uTime * 0.25;

	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);
	*/

	vec3 q;
	vec3 d = vec3(p, 0.5) * clamp(sin(t), 0.5, 1.0);
	float s;
	float e;
	float g = 0.0;

	for (float i = 0.0; i < 90.0; i++)
	{
		q = R(g * d, normalize(H(uTime * 0.1)), g * 0.1);
		q.z += uTime * 0.5;
		q = asin(0.7 * sin(q));
		s = 2.5 + sin(0.5 * uTime * 3.0 * sin(uTime * 2.0)) * 0.5;

		for (int j = 0; j < 6; j++)
		{
			q = abs(q);
			q = q.x < q.y ? q.zxy : q.zyx;
			s *= e = 2.0;
			q = q * e - vec3(3.0, 2.5, 3.5);
		}

		g += e = abs(length(q.xz) - 0.3) / s + 2e-5;
		c += mix(vec3(1.0), H(q.z * 0.5 + uTime * 0.1), 0.4) * 0.02 / exp(0.5 * i * i * e);
	}
	c *= c - lif;
	c *= c + liff;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;

	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}