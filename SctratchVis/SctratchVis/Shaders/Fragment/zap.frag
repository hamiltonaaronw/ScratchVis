#version 410

#extension GL_OES_standard_derivatives : enable

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

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec3 rgb2hsv(vec3 c)
{
	vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	vec4 p = mix(vec4(c.bg, k.wz), vec4(c.gb, k.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;

	return vec3(
		abs(q.z + (q.w - q.y) / (6.0 * d + e)),
		d / (q.x + e),
		q.x
	);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	//float x = mod(uFreq * 4.0, 1.0);
	//float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	//float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	//float f = min(abs(uFreq), abs(uLastFreq)) + abs((abs(uFreq - uLastFreq)) / 2.0);
	float ff = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float tf = atan(tm, ff);
	float fsum = abs(uFreq - uLastFreq) + f + tm + ff + tf;
	float t = tm / fsum;

	vec2 v = uRes.xy;
	vec2 q = gl_FragCoord.xy;

	// position
	q = p / 4.5;

	// breathing effect
	float bfx = smoothstep(fsum + sin(uTime * 0.5), tf + cos(uTime * 0.25), fsum) * 100.0;
	bfx += (atan(tm, 1.0 - fract(ff)) + t) * (f * 300.0);
	bfx -= (abs(1.0 - fract(bfx * 10.0) * 10.0));

	q += q * sin(dot(q, q) * 20.0 - uTime) * 0.04 * bfx;

	// rotate
	q *= rot(uTime * 0.75);

	float a = 2.0;
	float b = 3.0;
	float d = 1.0;

	// color
	for (float i = 0.5; i < 8.0; i++)
	{
		// fractal formula and rotation
		q = abs(2.0 * fract(q - 0.5) - 1.0) * mat2(cos(0.01 * (uTime + q.x * 0.1) * i * i + 0.85 *vec4(1.0, 8.0, 3.0, 1.0)));

		a /= atan(ff, i);
		b += sinc(i) * mod(ff, tm);
		d *= abs(0.9 - i);

		// coloration
//c += exp(-abs(q.y) * 5.0) * (cos(vec3(2.0, 3.0, 1.0) * i) * 0.5 + 0.5);
		c += exp(-abs(q.y) * 5.0) * (cos(vec3(a, b, d) * i) * 0.5 + 0.5);
	}

	c = abs(1.0 - c);
	//c.g *= 0.25;//(0.5 - uFreq * c.r);
	//c /= rgb2hsv(c);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	vec4 ret;

	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}
