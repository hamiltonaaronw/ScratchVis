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

float hash(vec2 p)
{
	vec3 q = vec3(p.xy, 1.0);
	float ret = fract(sin(dot(q, vec3(37.1, 61.7, 12.4))) * 3758.5453123);

	return ret;
}

float noise(vec2 p)
{
	vec2 i = floor(p);
	vec2 f = fract(p);
	f *= f * (3.0 - 2.0 * f);

	float ret = mix(mix(hash(i + vec2(0.0)), hash(i + vec2(1.0, 0.0)), f.x),
					mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x),
					f.y);

	return ret;
}

float fbm(vec2 p)
{
	float v = 0.0;
	float a = 1.0;
	float b = 0.75;
	for (int i = 0; i < 4; i++)
	{
		v += noise(p * a) * b;
		a *= 3.0;
		b = b == 0.75 ? b - 0.25 : b * 0.5;
	}

	/*
	v += noise(p * 1.0) * 0.75;
	v += noise(p * 3.0) * 0.5;
	v += noise(p * 9.0) * 0.25;
	v += noise(p * 27.0) * 0.125;
	*/

	float ret = v;
	return ret;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sinc(a), cos(a)
	);

	return ret;
}

vec3 col(vec2 p)
{
	vec2 q = p;
	q.x *= uRes.x / uRes.y;
	q.y -= 0.25;


	float f = (abs(uFreq) + abs(uLastFreq) + abs(uDeltaFreq)) / 2.0;

	float ti = uTime * 0.1;
	vec3 c = vec3(f * 0.1);
	
	for (int i = 0; i < int(floor(fract(uFreq) * 100.0)); ++i)
	{
		float j = float(i) * f / fbm(q * sin(uTime));
		float a = 10.0 + (j * 500.0);
		float pe = 2.0 + (j + 2.0);
		float thicc = mix(0.9, 1.0, noise(q * j));
		float t = abs(1.0 / (sin(q.y + fbm(q + ti * pe)) * a) * thicc);

		float f_ind = mod(p.x / p.y, length(p)) / f;
		int ind = int(floor(fract(f_ind * 10.0)));

		c += t * vec3(
			atan(0.5, f) * (p.x * sin(uFreq)) + f,
			exp(0.95 * f) - exp(fract(uSpectrum[i * 10 * ind] * 10.0)),
			fract(sinc(f * 10.0)) * (p.y * sin(uTime))
			);


/*
		c += t * vec3(
			f * atan(f, sinc(p.x)), 
			fract(tanh(f)),
			sin(uTime)
		);
		
		*/

	}

	vec3 ret = uFreq == 0.0 ? vec3(0.0) : c;

	return ret;// * 0.75;
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret;

	//ret = vec4(1.0);
	ret = vec4(col(uv), 1.0);
	ret *= vec4(col(vec2(uv.x, uv.y + 1.5)), 1.0);
	retColor = ret;
}