#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

out vec4 retColor;

uniform float uFreq;
uniform float uTime;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform vec2 uRes;

#define R(p, a, r) mix(a * dot(p, a), p, cos(r)) + sin(r) * cross(p, a)
#define H(h) (cos((h) * 6.3 + vec3(0, 23, 21)) * 0.5 + 0.5)

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
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

vec2 pmod(vec2 p, float r)
{
	float a = atan(p.x, p.y) + PI / r;
	float n = TAU / r;
	a = floor(a / n) * n;
	return  p * rot(-a);
}

float box(vec2 p, vec2 b)
{
	vec2 q = abs(p) - b;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);
	vec4 co = vec4(0.0);

	p *= rot (uTime);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = abs(uFreq - uLastFreq) + f + tm + ff + tf;
	float t = tm / fsum;

	vec2 q = p;
//q = pmod(q, abs(sin(uTime) * 16.0));
	q = pmod(q, abs(sin(uTime / t) * 16.0));

	vec3 c1 = vec3(0.0, 0.1, 1.0);
	vec3 c2 = vec3(1.0, 0.5, 0.1);
	vec3 c3 = vec3(1.0, 0.1, 0.1);
	vec3 c4 = vec3(1.0, 1.0, 0.1);

	c4 /= fsum;
	c3 -= sinc(t);

	c1.x += fsum;

	for (int i = 0; i < 8; i++)
	{
		q = abs(q) - 0.05;
//q *= rot(uTime);
		q *= rot(t - ff);
		float box = box(q, vec2(0.5 - q) * fsum);

//float w = abs(sin(uTime * 128.0 / 4.0) / 4.0 + 0.8);
		float w = abs(sin(t * 128.0 / 4.0) / 4.0 + 0.8);
		vec3 x = c1 * (0.05 * w) / length(box) * t;
		vec3 xc = c2 * (0.001) / length(q.x) + c3 * (0.001) / length(q.y) + c4 * (0.0015) / length(q);

		c += x + xc;
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.001 ? c : vec3(0.0);

	return ret;
}

void main() 
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);
	vec4 ret;

	ret = vec4(col(uv), 1.0);
	retColor = ret;

}