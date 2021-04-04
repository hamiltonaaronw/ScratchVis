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

vec3 hsv(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

float scale;

float map(vec3 p, float x)
{
	p.z -= uTime * -2.0;
	p.xy = abs(p.xy) - 2.0;
	if (p.x < p.y)
		p.xy = p.yx;
	p.z = mod(p.z, 1.0) - 2.0 + x;
	p.xy *= rot(uTime + (mod(x, 0.5)));

	p.x -= 2.0 * cos(uTime + p.z * 0.2 + p.y * 0.6 + x) * 0.88888888888;
	p = abs(p);
	float s = 2.0 + x;
	vec3 offset = p * 1.1 * x;
	
	for (float i = 0.0; i < 5.0; i++)
	{
		p = 1.0 - abs(p - 1.0);
		float r = -7.5 * clamp(0.38 * max(1.6 / dot(p, p), 1.0), 0.0, 1.0);
		s *= r;
		p *= r ;
		p += offset;
	}

	s = abs(s);
	scale = s;
	float a = 100.0;
	p -= clamp(p, -a, a);
	return length(p) / s;
}

float fNorm(float x)
{
	if (x < 1.0 && x > 0.01)
		return x;
	while (x > 1.0 && x < 0.01)
	{
		if (x > 1.0)
			x /= 10.0;
		else if (x < 0.01)
			x *= 10.0;
	}
	return x;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c;

	p *= rot(uTime * 2.0);

	float f = mod(fract(uFreq * 100.0), fract(uFreq * 10.0));
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);
	float ff = mod(
		fract(abs(uFreq - uLastFreq) * 10.0), f
	);
	ff = fNorm(ff);

	vec3 rd = normalize(vec3(p, 1));
	vec3 q = vec3(0.0, 0.0, -3.0);

	for (int i = 1; i < 50; i++)
	{
		float d = map(q,cos(uFreq) * sin(ff));
		q += rd * d;
		if (d < 0.01)
		{
			c = mix(vec3(1.0), cos(vec3(24, 6.0, 9) + log2(scale)) * 0.5 + 0.5, 0.5) * 12.0 / float(i);
		}
	}

	c -= hsv(c.r, c.g, c.b);
	c += 0.25;

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
