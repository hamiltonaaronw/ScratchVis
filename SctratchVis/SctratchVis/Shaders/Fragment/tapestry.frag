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

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

mat3 rot3(float a)
{
	mat3 ret = mat3(
		0.0, cos(a), sin(a), 
		0.0, -sin(a), cos(a),
		0.0, 0.0, 0.0
	);

	return ret;
}

mat4 rot4(float a)
{
	mat4 ret = mat4(
		0.0,	0.0,		0.0,	0.0,
		0.0,	cos(a),		sin(a), 0.0,
		0.0,	-sin(a),	cos(a),	0.0,
		0.0,	0.0,		0.0,	0.0
	);
	return ret;
}


float m(vec3 p)
{
	vec3 q = p;
	p.z *= sin(uTime) + uFreq;
	p.z *= 0.5;
	float s = 1.0;
	float k;

	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);

	for (float i = 1.0; i <= 5.0; i++)
		p *= k = 2.0 / dot(p = mod(p - 1.0, 2.0) - 1.0, p), s *= k;

	p.xy *= sin(oTexCoord.xy);
	p.xy *= sin(oTexCoord.xy);
	p.xy *= sin(oTexCoord.xy);

	p += (uTime * 0.001);

	s += sin(s * f)  + cosc(uTime / uDeltaFreq);

	return length(p) / s;
}

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	float tf = sin(uTime + uFreq) / uFreq;
	
	vec3 d = vec3(gl_FragCoord.xy / uRes.y - 0.5, 1.0) / 2.0;
	vec3 o = vec3(1.0, 1.0, 0.0);
	for (float i = 1.0; i <= 80.0; i++)
		o += m(o) * d;// - dot(p, p);


	float r = sin(tf / f) - mod(min(sin(f), sinc(f)), max(sin(f), sinc(f)));
	float g = cos(sin(tf)) / 0.5 * mod(min(cos(f), cosc(f)), max(cos(f), cosc(f)));
	float b = min(uFreq, mod(uTime, 1.0)) / m(vec3(f, tf, uFreq));


	vec3 c = vec3(
		smoothstep(r, g, b) * f,
		smoothstep(b, r, g) / 2.0,
		smoothstep(g, b, r)
		);

	vec3 ret = c + m(c - sin(f + tf));
	ret += (o.z - 2.0);

	return ret;
}

void main()
{
	vec2 uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);
	retColor = vec4(mod(uTime, 0.8), mod(uTime, 0.5), mod(uTime, 0.7), sin(mod(uFreq, 1.0)));
	retColor = vec4(col(uv), 1.0);
}