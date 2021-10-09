#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
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

mat2 rot(float f)
{
	return mat2(
		cos(f), sin(f),
		-sin(f), cos(f)
	);
}

vec3 hsv(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0, 2, 1) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) -1.0) * s + 1.0) * v;
}

float box(vec3 p, vec3 b)
{
	vec3 d = abs(p) - b;
	return length(max(d, 0.0));
}

float ifsBox(vec3 p)
{
	for (int i = 0; i < 6; i++)
	{
		p = abs(p) - 1.0;
		p.xz *= rot(0.7);
		p.xy *= rot(0.8);
	}

	return box(p, vec3(0.0, 0.9, 0.2));
}

float map(vec3 p)
{
	float c = 8.0;
	p.z = mod(p.z, c) - c * 0.5;

	return ifsBox(p);
}

vec3 col(vec2 p)
{
	float x = mod(uFreq * 4.0, 1.0);
	//float f = mix(min(uFreq, uLastFreq), max(uFreq, uLastFreq), sin(uTime));
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float ff = mod(fract(uFreq * 100.0), fract(uFreq * 10.0)) * f;
	vec3 fcv = cross(vec3(f, ff, f), vec3(uFreq, uLastFreq, f));
	float fc = length(fcv);

	p *= rot(uTime);

	vec3 ret;
	vec3 c = vec3(0.0);

	vec3 cPos = vec3(2.5 * sin(0.4 * uTime), 0.5 * cos(1.3 * uTime), - 20.0 * uTime);
	vec3 cDir = vec3(0.0, 0.0, -1.0);
	vec3 cUp = vec3(0.0, 1.0, 0.0);
	vec3 cSide = cross(cDir, cUp);

	vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir * fc);

	float t = 0.0;
	float acc = 0.0;
	for (int i = 0; i < 129; i++)
	{
		float qf = fc;
		qf = abs(fc - length(fcv) + sin(f));
		vec3 q = cPos + ray * t;// + pow(ff, fc);
		float dist = map(q);// * f * atan(fc, uFreq);

		dist = max(abs(dist), abs(0.02 - (qf / 100.0)));
		float a = exp(-dist * 3.0 + qf);
		if (mod(q.z - 60.0 * uTime, 50.0 * q.z) < 8.0)// + (ff * 100.0))
			a *= 5.0 + f;
		acc += a;

		t += dist * 0.25;// *+- fc;// / sinc(f);

		if (t > 100.0)
			break;
	}

	//c = fcv + min(sinc(ff), sin(fc));

	float hr = fract(0.06 * uTime) / length(fcv);
	float hg = mod(0.6 - f, 0.6) / fc;
	float hb = acc * 0.01;
	hb *= fc;
	c = hsv(hr, hg, hb) * 0.25;

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;
	
	retColor = vec4(col(uv), 0.5);
}