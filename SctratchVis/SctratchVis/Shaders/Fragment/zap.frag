#version 410

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
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float sdTorus(vec3 p, vec2 t)
{
	vec2 q = vec2(length(p.xz) - t.x, p.y);
	return length(q) - t.y;
}

float de(vec3 p, float f)
{
	float t = -sdTorus(p, vec2(2.3, 2.0));
	p.y += f;
	float d = 100.0;
	float s = mod(0.5, fract(f * 10.0));
	p *= 0.5;


	for (int i = 0; i < 2; i++)
	{
		p.xz *= rot(f);
		p.xz = abs(p.xz);
		float inv = 1.0 / clamp(dot(p, p), fract(f * 10.0), 1.0);
		s /= inv;
		d = min(d, length(p.xz) + fract(p.y * f + uTime * 0.2) - sin(f));
	}

	return min(d / s, t);
}

float march(vec3 from, vec3 dir, float f)
{
	float td = 0.0;
	float g = 0.0;

	vec3 p;

	float modR = min(cosc(f), sinc(uTime * 0.1));
	float modL = max(cosc(f), sinc(uTime * 0.1));

	for (int i = 0; i < 100; i++)
	{
		p = from + dir * td;
		float d = de(p, f) - mod(uTime, sinc(length(p)) / cosc(f));

		if (d < mod(modL, modR))
			break;

		g++;
		td += d * f;
	}

	return smoothstep(0.3, 0.0, abs(0.5 - fract(p.y * 15.0))) * exp(-0.07 * td * td) * sin(p.y * 10.0 + uTime * 10.0) + g * g * 0.00008;
}

vec3 col(vec2 p)
{
	vec3 ret;

	p /= 2.5 + mod(fract(uFreq * 10.0) + uFreq, abs(abs(uFreq / uLastFreq) + 0.5));

	float f = (abs(uFreq) + abs(uLastFreq)) * 0.5;
	float ff = fract(f * 100.0);
	float ft = mod(f, uTime * 0.1);
	float tf = uFreq * (fract(ft * 10.0));

	vec2 q = p;

	q.x *= uRes.x / uRes.y;

	float t = uTime * 0.5;
	t += mod(t, ft);

	vec3 from = vec3(0.0, sin(ft * 0.1), -3.3);
	vec3 dir = normalize(vec3(p, 0.7));
	dir.xy *= rot(uTime + sin(tf));//rot(0.75 * sin(ft));
	dir.xy *= rot(max(sin(uLastFreq), sin(uFreq)) * ft);
	float c = march(from, dir, sin(ft * sinc(tf)));


	ret = vec3(
		fract(f + c) / sinc(tf),
		clamp((sinc(c) / cos(ft)) / sin(t), uFreq, tf * 0.5),
		fract(c) * fract(uFreq * (ft * 10.0))
		);

	ret += abs(uFreq - uLastFreq);

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;
	
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	//uv = gl_FragCoord.xy / uRes.xy - 0.5;

	ret = vec4(col(uv), 1.0);
	//ret = col(uv);
	retColor = ret;
}
