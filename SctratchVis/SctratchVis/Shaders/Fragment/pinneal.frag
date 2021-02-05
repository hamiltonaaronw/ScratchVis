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
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

vec3 zFunc(vec2 v, float f)
{
	float x = v.x * 32.0;
	float y = -v.y * 32.0;

	float t = atan( f * x, uTime * y);

	float d = sqrt(x * x + y * y + (f / f));
	float g = sin(d - ((f /f) + t) * 9.0) / d * (20.0 + (fract(f * 10.0) * 10.0));
	float z = g + g;

	return vec3(z - 0.5, 0.2 - z, 1.0 - z);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p *= rot(uTime * 3.0);

	float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	float d = sin(uTime / 2.0);
	d *= d;
	d *= 0.3;

	float  x = 0.0;

	vec2 q = vec2(f, ff);
	q *= -rot(uTime);
	float q2 = length(q) / uFreq;

	x = mod(q2, uFreq);
	x *= 0.00075;

	vec3 c1 = zFunc(p - vec2(d, x), ff);
	vec3 c2 = zFunc(p - vec2(-d, x), ff);
	vec3 c3 = zFunc(p - vec2(x, d), ff);
	vec3 c4 = zFunc(p - vec2(x, -d), ff);
	vec3 c5 = zFunc(p - vec2(x, x), ff);

	c = c1 + c2 + c3 + c4 + c5;
	c *= q2;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0009 ?  c : vec3(0.0);
	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv = gl_FragCoord.xy / uRes.xy * 2.0 - 2.0;
	uv /= 1.5;


	//float h = hue(uv);
	//ret = vec4(hueRGB(h), 1.0);
	ret = vec4(col(uv), 1.0);

	retColor = ret;
}