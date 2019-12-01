#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

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

vec3 hue(float h)
{
	vec3 ret = clamp(abs(fract(h + vec3(3.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
	return ret;
}

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec4 grid(vec2 p, float n)
{
	vec2 r = vec2(1.0, 1.732);
	vec2 h = r * 0.5;
	vec2 q = p * n;

	vec2 a = mod(q, r) - h;
	vec2 b = mod(q - h, r) - h;

	q = length(a) < length(b) ? a : b;
	vec2 i = floor(p * n);

	vec4 ret = vec4(q, i);

	return ret;
}

float hex(vec2 p)
{
	p = abs(p);
	float c = dot(p, normalize(vec2(1.0, 1.732)));

	c = max(c, p.x);
	
	float ret = c;

	return ret;
}

vec2 polar(vec2 p)
{
	vec2 ret = vec2(length(p), atan(p.x, p.y) + PI);

	return ret;
}

float n21(vec2 p)
{
	p += fract(p * vec2(233.34, 851.73));
	p += dot(p, p + 23.45);

	float ret = fract(p.x * p.y);

	return ret;
}

vec2 n22(vec2 p)
{
	float n = n21(p);

	vec2 ret = vec2(n, n21(p + n));

	return ret;
}

float lDist(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a;
	vec2 ba = b - a;

	float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

	float ret = length(pa - ba * t);

	return ret;
}

float line(vec2 p, vec2 a, vec2 b)
{
	float d = lDist(p, a, b);
	float f = 1.0 - min(length(p - a), length(p - b));
	float m = smoothstep(f * 2.0, 0.2, d * 20.0);
	m *= smoothstep(1.2, 0.8, length(a - b));
	m *= f * f * f;

	float ret = m;

	return ret;
}

float layer(vec2 p)
{
	float m = 0.0;

	return m;
}

vec3 uni(vec2 p, float m)
{
	if (m > 0.0)
		return vec3(0.0);

	float t = uTime * 0.1;
	p *= rot(t);

	for (float i = 0.0; i < 1.0; i += 1.0 / 4.0)
	{
		float z = fract(i + t);
		float sz = mix(10.0, 0.5, z);
		float fade = smoothstep(0.0, 0.5, z) * smoothstep(1.0, 0.8, z);

		m += layer(p * sz + i * 20.0) * fade;
	}

	vec3 base = sin(t * vec3(0.3, 0.5, 0.7)) * 0.2 + 0.6;

	vec3 ret = vec3(m * base);

	return ret;
}

vec3 col(vec2 p)
{
	float f = abs(uFreq - uLastFreq) + abs(uDeltaFreq);
	float ff = fract(f * 100.0);

	vec2 q = length(p) < ff * 5.0 ? p / (2.5 + f) : p / (2.5 - f);
	q *= rot(uTime * 0.1);// + clamp(ff, 0.1, 0.5));
	vec4 coord = grid(q / ff, TAU * ff + f);
	vec2 st = coord.xy;

	float t = uTime;

	float r = length(hex(st));
	float ind = ((coord.w * 3.0) + (coord.z * 3.0)) * 0.6;
	float d = length(p / ff);//length(gl_FragCoord.xy - uRes.xy / 2.0) / uRes.y * ff;

	float r1 = smoothstep(0.3 + sin(t + d * 3.0) * 0.1, 0.4 + sin(uTime + d * 3.0) * 0.15, r);
	float r2 = smoothstep(0.1 + sin(t + d * 3.0) * 0.1, 0.37 + sin(uTime + d * 3.0) * 0.15, r);

	vec3 c = vec3(
		tanh(f),
		cos(ff / uTime) * 0.2,
		0.1 + sin(t * 0.3 + d) * 0.2
	);

	//c += sinc(uTime) + fract(uDeltaFreq * 100.0);
	if (r > r1 && r < r2)
		c += vec3(0.2 + f);

	c += uni(q, c.b);
	c *= hue(sin(uTime) + uFreq / length(c));
	vec3 ret = c;

	return ret;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;
	vec4 ret;

	//ret = vec4(mix(col(uv), col1(uv), uFreq), 1.0);
	//ret = vec4(col1(uv), 1.0);

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}