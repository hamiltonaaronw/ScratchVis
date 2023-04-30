#version 450

// derived from https://glslsandbox.com/e#102713.0

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

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


mat2 rot(float a)
{
	return mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);
}

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	vec3 vf = uSpec3;
	float a, b, d, g;
	float lvf;
	float t = uTime * 0.25;

	
	vf *= sin(t * (uSpecSum / 256) / TAU);
	lvf = length(vf);
	
	float tf = clamp((t * 0.5), vf.x, step(uFreq, lvf)) + f;
	float df = (abs(uLastFreq - uFreq) * 0.5);

	// camera bounce
	p *= sin(uTime) + df;

	vec2 q = 3.0 * p;
	q *= rot(uTime * 0.5);

	vec3 col1 = vec3(1.0, 2.0, 8.0);
	vec3 col2 = vec3(8.0, 2.0, 1.0);

	a = length(q);
	b = 0.6 / (sin(tf) * (0.3 * uFreq) * TAU);
	d = df / mod(lvf, tf + sin(t));
	g = atan(lvf, df);

	float m1 = uFreq > 0.00001 ? 
				sin(a * b - d * g) : 
				sin(length(q) * 0.3 - uTime * 0.3);

	a = length(q * -inverse(rot(t)));

	b = (1.3 + uFreq) + (exp2(df));
	d = exp2(df) * dFdyCoarse(tf * lvf);
	g = atan(inversesqrt(lvf + tf), df);

	float m2 = uFreq > 0.00001 ? 
				sin(0.3 * (a * b - d * g)) : 
				sin(0.3 * (length(q) * 0.3 - uTime * 0.3));

//float c1 = 0.012 / abs(length(mod(q, 2.0 * m1) - m1) - 0.3);
	float c1 = 0.012 / abs(length(mod(q, 2.0 * m1) - m1) - 0.3);


//float c2 = 0.012 / abs(length(mod(q, 2.0 * m2) - m2) - 0.3);
	float c2 = 0.012 / abs(length(mod(q, 2.0 * m2) - m2) - 0.3);

	float al = uFreq < 0.00001 ? 1.0 :
				(df * g) + 0.3;

	c = col1 * c1;
	c += col2 * c2;
	c *= al;
	//c = mix(col1 * c1, col2 * c2, al);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = c;

	return ret;
}

void main()
{
	vec2 uv;
	uv = (gl_FragCoord.xy - 0.5 - uRes) / min(uRes.x, uRes.y);

	retColor = vec4(col(uv), 1.0);
}