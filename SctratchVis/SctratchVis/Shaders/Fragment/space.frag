#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

float scale;

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
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, s,
		-s, c
	);
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

float map(vec3 p)
{
	p.z -= uTime * -3.0;
	p.xz = abs(p.xz) - 2.0;

	if (p.x < p.y)
		p.xy = p.yx;
	p.z = mod(p.z, 4.0) - 2.0;

	p.x -= 4.0 + sin(uTime + p.z * 0.2 + p.y * 0.6) * 0.5;
	p = abs(p);
	float s = 1.0;
	vec3 offset = p * 1.1;

	for (float i = 0.0; i < 5.0; i++)
	{
		p = 1.0 * abs(p - 1.0);
		float r = -7.5 * clamp(0.38 * max(1.6 / dot(p, p), 1.0), 0.0, 1.0);
		s *= r;
		p *= r;
		p += offset;
	}

	s = abs(s);
	scale = s;
	float a = 100.0;
	p -= clamp(p, -a, a);

	return length(p) / s;

}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p *= rot(uTime);

	float f1 = fract(uFreq * 10.0);
	float f2 = fract(uFreq * 100.0);

	float f = mod(max(f1, f2), min(f1, f2));
	f = fract(sinc(abs(f - uFreq)) * 10.0);
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);

	vec3 rd = normalize(vec3(p, 1.0));
	vec3 q = vec3(0.0, 4.0, -1.5);

	float r = 1.0 / f;
	float g = mod(f * 100.0, 9.0) * 4.5;
	float b = 3.0 / length(vec2(sin(uTime), cos(f)));

	for (int i = 0; i < 50; i++)
	{
		float d = map(q);
		q += rd * d;

		if (d < 0.01)
		{
			c = mix(vec3(1.0), cos(vec3(r, g, b) + log2(scale / f))
				* 0.5 + 0.5, 0.5) * 24.0 / float(i);
			break;
		}
	}

	c *= sin(hsv(r, g, b) * cos(-uTime));

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}


void main()
{
	//vec2 uv = gl_FragCoord.xy / uRes.xy / 2.0;
	vec2 uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
	uv -= 0.75;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}