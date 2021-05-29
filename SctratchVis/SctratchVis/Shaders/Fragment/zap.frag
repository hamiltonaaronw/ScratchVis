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

float layer (vec2 v)
{
	float s = 0.5;
	for (int i = 0; i < 8; i++)
	{
		v = abs(v) - s;
		v *= 1.25;
		v = v.yx;

		v *= rot(uTime * 0.1);
		s *= 0.995;
	}

	float d = abs(max(abs(v.x), abs(v.y)) - 0.3);

	return 0.01 / d;
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
	vec3 c = vec3(0.2, 0.3, 0.4);

	//p *= rot(uTime * 0.1);

	float x = mod(fract(uFreq * 8.0) * 2.0, 1.0);
	x = sinc(x);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 14.0);
	float ft = sin(uTime * f) + f;
	float t = fract(uTime / f);// uTime +smoothstep(min(ft, fs), min(f, fs), uLastFreq) * uFreq;
	ft = abs(ft - t) * sinc(f);
	ft += sinc(uTime * fs) - f;
	ft *= mod(f, 0.25);
	ft *= mod(f, 0.25);
	ft += mod(fs, 0.25);

	float s = 0.5;

	p *= rot((uTime + uFreq) * 0.1);

	for (int i = 0; i < 4; i++)
	{
		p = abs(p) - s;
		p *= 1.25;
		p *= rot(ft * 0.1);
		s *= 0.995;
	}

	p *= sin(ft) + (2.0 * uFreq);

	p *= rot(ft * 0.1);

	t -= step(max(t, ft), min(t, ft)) * uFreq;

	for (float i = 0.0; i < 1.0; i += 0.3)
	{
		p *= rot(0.8);
		float t = fract(i + ft * 0.1);
		float s = smoothstep(1.0, 0.0, t);
		float r = smoothstep(2.0, 0.1, t);
		r *= smoothstep(0.0, 1.0, t);
		c += layer(p * s) * r;
	}

	c *= vec3(
		1.0 / f,
		ft - abs(1.0 - fs) + 0.7,
		t * c.r * uFreq + 0.3
	);

	c.r += sin(t) * 0.125;
	c.g *= sinc(t) * c.r;
	c.g += sin(t) / c.g;

	c /= rgb2hsv(c * f) / 0.5;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.009 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	//uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
	uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y * 2.0 - 2.0;
	uv.x -= 1.5;
	uv /= 5.0;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}
