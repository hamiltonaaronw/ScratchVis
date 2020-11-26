#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float tanc(float x)
{
	return tan(x) / x;
}

float hash(vec2 p)
{
	float ret = fract(43316.3317 * sin(dot(p, vec2(12.5316, 17.15611))));
	return ret;
}

float N(vec2 p)
{
	vec2 i = floor(p);
	vec2 fr = fract(p);

	float a0 = hash(i);
	float a1 = hash(i + vec2(1.0, 0.0));
	float a2 = hash(i + vec2(0.0, 1.0));
	float a3 = hash(i + vec2(1.0, 1.0));

	vec2 u = fr * fr * (3.0 - 2.0 * fr);
	float ret = mix(mix(a0, a1, u.x), mix(a2, a3, u.x), u.y);

	return ret;
}

vec2 N2(vec2 p)
{
	vec2 ret = vec2(N(p), N(p + vec2(1.0)));
	return ret;
}

float sdLine(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

	float ret = length(pa - h * ba);
	return ret;
}

vec3 rot3(vec3 p, float an, vec3 ax)
{
	vec3 a = normalize(ax);
	float s = sin(an);
	float c = cos(an);
	float r = 1.0 - c;
	mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );

	vec3 ret = m * p;

	return ret;
}

vec3 col(vec2 p)
{
	vec2 q = p;
	vec3 ret;
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);

	q.y /= sqrt(3.0) / 2.0;
	q.x += q.y * 0.5;
	q.y -= f * 0.1;

	vec2 i = floor(q);
	float t = sin(uTime / 0.5) + f;
	t += mod(N(vec2(uFreq)) * hash(vec2(f)), 0.25);

	t += cos(uTime) + f;
	
	vec2 a0 = N2(i + t) + i;
	vec2 a1 = N2(i + vec2(1.0, 0.0) + t) + i + vec2(1.0, 0.0);
	vec2 a2 = N2(i + vec2(-1.0, 0.0) + t) + i + vec2(-1.0, 0.0);
	vec2 a3 = N2(i + vec2(0.0, 1.0) + t) + i + vec2(0.0, 1.0);
	vec2 a4 = N2(i + vec2(0.0, -1.0) + t) + i + vec2(0.0, -1.0);
	vec2 a5 = N2(i + vec2(1.0, 1.0) + t) + i + vec2(1.0, 1.0);
	vec2 a6 = N2(i + vec2(-1.0, -1.0) + t) + i + vec2(-1.0, -1.0);

	float l = sin(f);
	l *= 0.75 + f;

	l = min(l, sdLine(q, a0, a1));
	l = min(l, sdLine(q, a0, a2));
	l = min(l, sdLine(q, a0, a3));
	l = min(l, sdLine(q, a0, a4));
	l = min(l, sdLine(q, a0, a5));
	l = min(l, sdLine(q, a0, a6));
	l = min(l, sdLine(q, a3, a2));
	l = min(l, sdLine(q, a4, a1));

	float s = sin(l * 150.0 * PI);

	vec3 rot = rot3(
		normalize(vec3(q, f)), 
		radians(hash(vec2(t))), 
		vec3(0.0, 0.0, 1.0)
		);

	vec3 c = vec3(
		length(reflect(rot, normalize(rot))),
		cos(uTime) + f * pow(f, sinc(uTime / t) / fs) * t + f,
		abs(1.0 - t) + f
		);

	//vec3 cc = cross(c, rot);
	//vec3 ref = refract(c, cc, sin(uFreq));

	//c *= mix(c, ref, f);

	ret = abs(c - dot(p, p * uFreq)) * sinc(s) / (1.0 - (1.0 - uFreq));

	//ret = reflect(c * s, normalize(mix(c, rot, f)));
	ret = uFreq > 0.0 ? c * s : vec3(0.0);

	//ret = vec3(0.0, 1.0, 0.0);
	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy * 2.0 - uRes.xy) / min(uRes.x, uRes.y);
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;
}