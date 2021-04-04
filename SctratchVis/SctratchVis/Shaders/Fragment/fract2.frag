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
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
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
	float ff = mod(fract(uFreq * 100.0), fract(uFreq * 10.0));
	float f = mix(min(uFreq, uLastFreq), max(uFreq, uLastFreq), sin(uTime));

	//p.y *= sin(uTime) * 4.0;// / sin(step(uFreq, f));
	p.x -= 500.0;

	//float _t = step(uTime, f);
	float _t = 1.0 / mix(length(p) / uFreq, f, uTime);
	const float span = 1.5;
	const float r = span / 2.0;
	float zt = -9e9;
	float zb = 9e9;

	vec3 ret;
	vec3 c = vec3(0.0);

	for (float y = -480.0; y < 480.0; y += span)
	{
		float x = (floor(p.x / span) + 0.5) * span + y / 2.0;
		float t = radians(length(vec2(x, y))) - fract(uTime * 0.8) * TAU;
		float z = (cos(t - f) * 100.0 - cos(t * 3.0 + f) * 30.0) + y / 2.0;
		vec2 q = vec2((x + f) - (y + f / p.x) / 2.0, z + f);
		float d = distance(p, q) / r - (1.0 + ff);
		float cd = length(vec2(x, y)) * 0.4 * _t;
		float o = uTime * -1.5;
		c += step(d, 0.0) * clamp((step(z, zb) + step(zt, z)), 0.0, 1.0)
			* vec3(1.0 + sin(cd + o), 1.0 + sin(cd + 2.0 + o), 1.0 + sin(cd - 2.0 + o)) * -d;
		zt = max(zt, z);
		zb = max(zb, z);
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	//uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 0.5;
	uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.x;
	uv *= 500.0;
	
	retColor = vec4(col(uv), 1.0);
}