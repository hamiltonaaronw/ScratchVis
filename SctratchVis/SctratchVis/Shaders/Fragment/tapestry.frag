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

vec2 pMod(vec2 p, float n)
{
	float a = mod(atan(p.y, p.x), TAU / n) - 0.5 * TAU / n;
	return length(p) * vec2(sin(a), cos(a));
}

float map(vec3 p, float f)
{
	p.xy *= rot(uTime * (mod(f + 0.7, 1.3) * 0.0015));
	p.yz *= rot(uTime * 1.02);
	//p.zx *= rot(uTime * 0.15);
	for (int i = 0; i < 4; i++)
	{
		p.xy = pMod(p.xy, (12.0 / f) * (0.7 + fract(f * 10.0)));
		p.y -= 2.0;// + sin(f);
		p.yz = pMod(p.yz, 12.0);// 1.0 - (12.0 / f) * 0.5);// * cosc(f));
		p.z -= 10.0;// + f;
	}

	return dot(abs(p), normalize(vec3(11.0 + sin(uTime), 1.5 + 0.4 * sin(uTime * 0.88), 6.0))) - 0.7;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

vec3 hsv(vec3 v)
{
	return hsv(v.x, v.y, v.z);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	p *= rot(uTime);
	vec3 rd = normalize(vec3(p, 1.0));
	vec3 q = vec3(0.0, 0.0, -4.0);

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float _f = abs(1.0 - (uFreq + f + ff));

	c = hsv(_f, f, sin(f)) + _f;
	c *= f;
	vec3 c2 = hsv(1.0 - length(c.rg), 1.0 - length(c.gb), 1.0 - length(c.br));

	for (int i = 1; i < 75; i++)
	{
		float d = map(q, _f);
		q += rd * d;
		if (d < 0.001)
		{
			//c = vec3(10.0 / float(i));
			c /= hsv(c2 * vec3(10.0 / float(i)));
			break;
		}
	}

	//c = sin(c) / cos(c);
	c *= sin(c);
	c -= cos(c2) * _f;
	//c = mix(c, c2, _f);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv ;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}