#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform float[256] uSpectrum;
uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
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

mat2 rot1(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

mat2 rot2(float a)
{
	return mat2(
		cos(a), sin(a),
		sin(a), -cos(a)
	);
}

vec3 col(vec2 p)
{
	vec2 q = p;
	q.x = dot(q, q * 2.5);


	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float lif = lanczosInterp(3, f);
	float liff = lanczosInterp(3, ff);

	float fd = min(f, lif) / max(f, lif);
	fd = mod(fd, 1.0);
	float ffd = max(ff, liff) / min(ff, liff);
	fd = mod(fd, 1.0);

	float r = fract(uSpectrum[int(floor(fract(liff * 100.0) * 100.0))]);

	q *= rot1(r + sin(uTime));

	float n = 16.0 * uFreq;

	float t = atan(q.y, q.x) / PI + sinc(fd);

	float cf = liff;

	float a = sin(2.0 * TAU * q.x * f);
	float b = sinc(TAU * q.y - sinc(liff) + atan(sin(f)));
	float c = sin(PI * (t + uTime));

	for (float i = 0.0; i < n; i++)
		cf += 0.001 / abs(a * b  * c + fd);

	vec3 co = vec3(
		exp(liff) / length(p),
		atan(dot(q, sin(q) / vec2(liff))),
		uSpectrum[int(mod(floor(fract(cosc(uFreq) * 100.0) * 100.0), 256))]
	);

	co *= cf;;

	vec3 ret;

	ret = co;

	return ret * uFreq;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}