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

float angle(vec2 p)
{
	if (p.x <= 0.0)
		return atan(p.y / p.x) / TAU + 0.5;
	if (p.y >= 0.0) 
		return atan(p.y / p.x) / TAU;

	return atan(p.y / p.x) / TAU + 2.0;
}

float dist(vec2 p)
{
	float ret = distance(vec2(0.0), p);
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
	vec3 ret;
	vec2 q = p;

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float lif = lanczosInterp(2, f);
	float liff = lanczosInterp(2, ff);

	float fd = max(f, lif) / min(f, lif);
	fd = clamp(fd, min(f, 0.1), mod(f, 1.0));
	float ffd = max(ff, liff) / min(ff, liff);
	ffd = clamp(ffd, min(f, 0.1), mod(uFreq, 1.0));

	q *= rot(uTime * 0.5);

	float a = angle(q * ff);
	float d = dist(q);

	float df = abs(uDeltaFreq - uLastFreq);

	float t = df >= 0.6 ? sin(uTime) : uTime + f;

	float va = sin(a * TAU * 6.0 + t) + ffd;
	float vb = cos(d * TAU * 0.5 - 4.0 * t + ffd);

	//float v1 = mix((va / vb), (va * vb), uFreq);
	float v1 = max(va / vb, vb / va) - (va * vb);
	float v2 = cos(v1 * PI * (1.125 * (2.5 * ffd)) + uTime * sin(liff));
	float v3 = cos(v2 * 15.0) * cosc(uFreq);

	vec3 c = vec3(
		v1  * d + sin(uTime / ffd),
		exp(liff) * v2,
		sin(exp(fract(df * v3 * 100.0) + ffd) * fd)
	);

	ret = c * uFreq;
	ret /= 1.0 - f;
	
	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}