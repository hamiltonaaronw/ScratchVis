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

float det(vec2 a, vec2 b)
{
	float ret;

	ret = (a.x * b.y) - (a.y * b.x);

	return ret;
}

vec2 intersect(vec2 a, vec2 b, vec2 p, vec2 q)
{
	vec2 xDiff = vec2(a.x - b.x, p.x - q.x);
	vec2 yDiff = vec2(a.y - b.y, p.y - q.y);

	float div = det(xDiff, yDiff);

	vec2 d = vec2(det(a, b), det(p, q));

	vec2 ret = vec2(det(d, xDiff), det(d, yDiff)) / div;

	return ret;
}

float sdSegment(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a,
		ba = b - a;

	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

	float ret = length(pa - ba * h);

	return ret;
}

vec2 coord(float a, float r)
{
	vec2 ret = vec2(cos(a), sin(a)) * r;

	return ret;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d)
{
	vec3 ret = a + b * cos(TAU * (c * t + d ));

	return ret;
}

vec3 col(vec2 p)
{
    //p -= ((p.y * p.x) + uFreq) * sin(uTime + uFreq);
	float t = uTime + sin(uFreq);
	float f = abs(uFreq + uLastFreq * sin(t)) * 0.5;
	float ff = fract(f * 10.0);
	t = cos(mod(sin(ff), t));
	ff = abs(abs(ff - f) - uLastFreq) - (t * 0.2) * 0.05;
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float fstep = smoothstep(sin(uFreq / f), uFreq + uLastFreq, uTime);
	float tf = smoothstep(sin(f), 2.0, uTime / 0.5);
	t /= fs;

	float fp = mod(f, 1.0) > mod(fract(ff), 1.0) ? 0.5 : mod(f, 1.0) + t;

	vec2 q = (p * t) * rot(tan(t + uFreq));// * rot(t + dot(vec2(f), vec2(ff)));
	q *= 5.0;
	q += vec2(cos(t + f), sin(t - f)) * (fract(ff) / 100.0);//0.1;
	q *= rot(3.0 * sin(atan(q.x, q.y) * 0.45));

	vec2 id = floor(q);
	q = fract(q) - mod(0.5, uFreq);

	float d = 0.0;

	vec3 c = vec3(0.0);
	float s = 6.0 + cos(floor(t) + pow(fract(t), 2.0)) * 2.0;
	float stepT = TAU / s;

	if (mod(id.x, 2.0) == 0.0)
		q.x = -q.x;
	if (mod(id.y, 2.0) == 0.0)
		q.y = -q.y;
	
	float rec = 45.0;
	float k = 0.05;
	float baseSz = 1.0;

	for (float j = 0.0; j < 1.0; j += (1.0 / rec))
	{
		float i = 0.0;

		for (int ii = 0; ii < 100; ++ii)
		{
			if (i > TAU) 
				break;

			d += smoothstep(0.018, 0.003, sdSegment(q, coord(i, baseSz), coord(i + stepT, baseSz)));
			i += stepT;
		}

		vec2 iPoint = intersect(vec2(0.0), coord(0.0 + k, baseSz),
			coord(stepT, baseSz), coord(0.0, baseSz));

		float dst = length(iPoint);

		q *= 1.0 / dst + ff;
		q *= rot(k);

		c += d * (palette(j + mod(t * 0.2, 2.0), vec3(0.5), vec3(0.5),
			vec3(0.5), vec3(0.5, 0.10, uFreq / 3.0)) / rec);
	}

	vec3 ret;
	ret = c;
//	ret *= (c * fp) * sinc(uFreq / mod(uTime, 0.75) + ff);
//	ret += abs(c / ff) + cosc(mod((uTime - uFreq), 0.5));

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;
	vec4 ret;

	vec3 c = col(uv);

	ret = vec4(c, gl_FragCoord.xy);

	retColor = ret;
}