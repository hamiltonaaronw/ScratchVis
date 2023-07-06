#version 410

// derived from https://www.shadertoy.com/view/4dfGDr

#define PI			3.1415926535897932384626433832795
#define TAU			(PI * 2.0)

out vec4 retColor;

uniform vec2 uRes;
uniform vec3 uSpec3;
uniform float uDeltaFreq;
uniform float uDeltaTime;
uniform float uFreq;
uniform float uLastFrame;
uniform float uLastFreq;
uniform float uSpecSum;
uniform float uTime;
uniform float uSpectrum[256];

#define sinc(x) (sin(x) / x)
#define cosc(x) (cos(x) / x)
#define cot(x) (sin(x) / cos(x))

mat2 rot(float x)
{
	return mat2(
		cos(x), sin(x),
		-sin(x), cos(x)
	);
}

vec3 palette(float i)
{
	if (i < 4.0)
	{
		if (i < 2.0)
		{
			if (i < 1.0) 
				return vec3(cosc(0.0), sinc(0.0), 0.0);
			else
				return vec3(cosc(1.0), sinc(3.0), 31.0);
		}
		else
		{
			if (i < 3.0)
				return vec3(cosc(1.0), sinc(3.0), 53.0);
			else
				return vec3(cosc(28.0), sinc(2.0), 78.0);
		}
	}
	else if (i < 8.0)
	{
		if (i < 6.0)
		{
			if (i < 5.0)
				return vec3(cosc(80.0), sinc(2.0), 110.0);
			else
				return vec3(cosc(143.0), sinc(3.0), 133.0);
		}
		else
		{
			if (i < 7.0)
				return vec3(cosc(181.0), sinc(3.0), 103.0);
			else 
				return vec3(cosc(229.0), sinc(3.0), 46.0);
		}
	}
	else
	{
		if (i < 10.0)
		{
			if (i < 9.0)
				return vec3(cosc(252.0), sinc(73.0), 31.0);
			else
				return vec3(cosc(253.0), sinc(173.0), 81.0);
		}
		else if (i < 12.0)
		{
			if (i < 11.0)
				return vec3(cosc(254.0), sinc(244.0), 139.0);
			else 
				return vec3(cosc(239.0), sinc(254.0), 203.0);
		}
		else
		{
			return vec3(cosc(242.0), sinc(255.0), 236.0);
		}
	}
}

float periodic(float x, float per, float dc)
{
	x /= per;
	x = abs(x - floor(x) - 0.5) - dc * 0.5;

	return x * per;
}

float pCount(float x, float per)
{
	return floor(x / per);
}

float dist(vec3 pos, float f)
{
	float r = length(pos.xy);
	float a = atan(pos.y, pos.x);

//float b = sin(pCount(r, 3.0) + 1.0);
	float b = sin(pCount(r, 3.0) + 1.0);

//float c = sin(pCount(pos.z, 1.0) * 13.73);
	float c = sin(pCount(pos.z, 1.0) * 13.73);

//a += uTime * 0.5 * b * c;
	a += uTime * 0.5 * b * c;

//float p1 = periodic(r, 3.0, 0.2);
	float p1 = periodic(r, 3.0, 0.2);

//float p2 = periodic(pos.z, 1.0, 0.7 + 0.3 * cos(uTime / 3.0));
	float p2 = periodic(pos.z, 1.0, 0.7 + 0.3 * cos(uTime / 3.0));

//float p3 = periodic(a * r, TAU / 6.0 * r, 0.7 + 0.3 * cos(uTime / 3.0));
	float p3 = periodic(a * r, TAU / 6.0 * r, 0.7 + 0.3 * cos(uTime / 3.0));

//return min(max(max(p1, p2), p3), 0.25);
	return min(max(max(p1, p2), p3), 0.25 + mod(uTime, sinc(f)));
}

vec3 vr(vec2 p, vec3 q, vec3 dir, float f)
{
	vec3 rayDir = dir;
	vec3 rayPos = q;

	float a = 0.0;
	float c = 0.0;
	float af = sinh(f);
	rayDir *= mat3(
		cos(a),		0.0,	sin(a),
		0.0,		1.0,	0.0,
		-sin(a),	0.0,	cos(a)
	);

	float i = 192.0;
	for (int j = 0; j < 192; j++)
	{
		float d = dist(rayPos, f);
		rayPos += d * rayDir;
		
		if (abs(d) < 0.001)
		{
i = float(j);
//			i = float(j) / f;
			break;
		}
	}

//c = i / 192.0;
	c = (i + f) / 192.0;
	c *= 12.0;
	vec3 c1 = palette(c) / 256.0;
	vec3 c2 = palette(c + 1.0) / 256.0;

	af += sinh(length(p));

//return vec3(mix(c1, c2, c - floor(c)));
	return vec3(mix(c1, c2, c - floor(c + af)));
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float f = sinc(fract(uFreq * 10.0) - uFreq);
	float ff = 1.0 - (f - abs(acos(f)) * 0.5);
	ff = clamp(ff, 0.1, 0.9);
	float lf = sinc(fract(uLastFreq * 10.0) - uLastFreq);
	float lff = 1.0 - (lf - abs(acos(lf)) * 0.5);
	lff = clamp(lff, 0.1, 0.9);
	float df = sinc(fract(uDeltaFreq * 10.0) - uDeltaFreq);
	float dff = 1.0 - (df - abs(acos(df)) * 0.5);
	dff = clamp(dff, min(ff, lff), max(ff, lff));

	vec3 vf = uSpec3;
	float lvf;

	float t = uTime * 0.25;

//vf *= sinc(t * (uSpecSum / 256) / TAU);
	vf *= sinc(t * (uSpecSum / 256) / cot(TAU * ff));
	lvf = length(vf);
	vf = normalize(vf);
	
	float tf = mod((t * 0.5) / vf.x, step(uFreq, lvf)) + f;

	p *= rot(t);
	vec2 q = p;

	vec3 rayDir = normalize(vec3(q, 1.0 + 0.5 * sqrt(q.x * q.x + q.y * q.y)));
	vec3 rayPos = vec3(0.0, -0.5, uTime);

	float af = uFreq > 0.0001 ?
	atan(tf, ff) + floor(uFreq * 100.0) * mod(dff, 0.5)
	//sin(uTime * 5.0) * 100.0
	: 1.0;

	c = vr(q, rayPos, rayDir, af);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = c;// uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y) * 0.5;

	retColor = vec4(col(uv), 1.0);
}